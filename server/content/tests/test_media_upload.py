"""Media COS upload tests — one-click publish-to-CDN."""
import json
import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from server.content import media  # noqa: E402


def _staged_record(**overrides):
    obj = {
        "id": str(uuid.uuid4()),
        "mediaType": "image/png",
        "byteSize": 10,
        "width": 1,
        "height": 1,
        "status": "STAGED",
        "publicObjectKey": "x.png",
        "createdAt": "2026-01-01T00:00:00+00:00",
    }
    obj.update(overrides)
    return obj


class UploadToCdnTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._old_s = media._S
        media._S = Path(self._tmp.name)
        self._old_i, self._old_l = media._I, media._L
        media._I = media._S / "_media.json"
        media._L = media._S / ".index.lock"
        self._old_base = media.PUBLIC_BASE_URL
        media.PUBLIC_BASE_URL = "https://media.example.com/"
        media._KEY_PREFIX = ""

    def tearDown(self):
        media._S = self._old_s
        media._I, media._L = self._old_i, self._old_l
        media.PUBLIC_BASE_URL = self._old_base
        media._KEY_PREFIX = "content"
        self._tmp.cleanup()

    def _store(self, obj, with_file=True):
        if with_file:
            (media._S / obj["publicObjectKey"]).write_bytes(b"data")
        media._atomic_update(lambda d: d.update({obj["id"]: obj}))
        return obj

    def test_upload_ok_marks_verified(self):
        obj = self._store(_staged_record())
        calls = {}

        class FakeClient:
            def put_object(self, **kw):
                calls.update(kw)

        with mock.patch.object(media, "_cos_client", return_value=(FakeClient(), {"bucket": "b"})), \
             mock.patch.object(media, "check_cdn_accessibility",
                               side_effect=lambda mid: self._force_verified(mid)):
            out = media.upload_to_cdn(obj["id"])
        self.assertTrue(out["uploaded"])
        self.assertEqual(calls["Key"], "x.png")
        self.assertEqual(calls["ContentType"], "image/png")
        self.assertIn("immutable", calls["CacheControl"])
        self.assertEqual(out["media"]["status"], "REMOTE_VERIFIED")

    def _force_verified(self, mid):
        media._atomic_update(lambda d: d[mid].update(
            {"status": "REMOTE_VERIFIED", "publicUrl": media.PUBLIC_BASE_URL + d[mid]["publicObjectKey"],
             "publiclyReadable": True, "stableUrl": True}))
        return {"media": media.get_media(mid), "result": {"ok": True}}

    def test_already_verified_skips_upload(self):
        obj = self._store(_staged_record(status="REMOTE_VERIFIED",
                                         publicUrl="https://media.example.com/x.png"))
        with mock.patch.object(media, "_cos_client", side_effect=AssertionError("must not upload")):
            out = media.upload_to_cdn(obj["id"])
        self.assertFalse(out["uploaded"])
        self.assertEqual(out["result"]["skipReason"], "already-verified")

    def test_unknown_media_raises_filenotfound(self):
        with self.assertRaises(FileNotFoundError):
            media.upload_to_cdn(str(uuid.uuid4()))

    def test_missing_staged_file_raises(self):
        obj = self._store(_staged_record(), with_file=False)
        with self.assertRaises(media.MediaUploadError) as ctx:
            media.upload_to_cdn(obj["id"])
        self.assertEqual(ctx.exception.code, "FILE_MISSING")

    def test_cos_not_configured_maps_to_error_code(self):
        obj = self._store(_staged_record())
        from server.content.config import CosConfigError
        with mock.patch.object(media, "_cos_client", side_effect=CosConfigError("COS env missing: X")):
            with self.assertRaises(media.MediaUploadError) as ctx:
                media.upload_to_cdn(obj["id"])
        self.assertEqual(ctx.exception.code, "COS_NOT_CONFIGURED")

    def test_key_prefix_derived_from_public_base(self):
        old = media.PUBLIC_BASE_URL
        try:
            media.PUBLIC_BASE_URL = "https://cdn.example.com/content/"
            media._KEY_PREFIX = "content"
            self.assertEqual(media._object_key({"publicObjectKey": "a.png"}), "content/a.png")
        finally:
            media.PUBLIC_BASE_URL = old
            media._KEY_PREFIX = ""

    def test_upload_pending_reports_per_item(self):
        ok = self._store(_staged_record())
        bad = self._store(_staged_record(publicObjectKey="missing.png"), with_file=False)
        with mock.patch.object(media, "upload_to_cdn",
                               side_effect=lambda mid: {"media": {"status": "REMOTE_VERIFIED"},
                                                        "uploaded": True,
                                                        "result": {"ok": True}}
                               if mid == ok["id"]
                               else (_ for _ in ()).throw(media.MediaUploadError("FILE_MISSING", "gone"))):
            out = media.upload_pending()
        self.assertEqual(out["count"], 2)
        self.assertEqual(out["uploaded"], 1)
        by_id = {r["id"]: r for r in out["results"]}
        self.assertTrue(by_id[ok["id"]]["ok"])
        self.assertEqual(by_id[bad["id"]]["status"], "FILE_MISSING")


class EnvConfigTests(unittest.TestCase):
    def test_public_base_url_default(self):
        # module-level constant already resolved at import; assert invariants only
        self.assertTrue(media.PUBLIC_BASE_URL.endswith("/"))
        self.assertTrue(media.PUBLIC_BASE_URL.startswith("https://"))

    def test_cos_config_requires_all_env(self):
        from server.content.config import CosConfigError, get_cos_config
        env = {"CONTENT_COS_SECRET_ID": "a", "CONTENT_COS_SECRET_KEY": "",
               "CONTENT_COS_REGION": "ap-shanghai", "CONTENT_COS_BUCKET": "b"}
        with mock.patch.dict(os.environ, env, clear=False):
            with self.assertRaises(CosConfigError):
                get_cos_config()
        env["CONTENT_COS_SECRET_KEY"] = "k"
        with mock.patch.dict(os.environ, env, clear=False):
            cfg = get_cos_config()
        self.assertEqual(cfg["bucket"], "b")


if __name__ == "__main__":
    unittest.main()
