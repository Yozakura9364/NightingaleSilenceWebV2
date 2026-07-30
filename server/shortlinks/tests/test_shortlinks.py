from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from server.shortlinks.app import create_app


class ShortLinkApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.token = "test-token"
        self.app = create_app(
            {
                "TESTING": True,
                "SHORTLINK_DB_PATH": str(Path(self.temp_dir.name) / "shortlinks.sqlite3"),
                "SHORTLINK_API_TOKEN": self.token,
                "SHORTLINK_API_TOKEN_FILE": "",
                "SHORTLINK_PUBLIC_BASE_URL": "https://nightingalesilence.com",
            }
        )
        self.client = self.app.test_client()
        self.auth = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        self.temp_dir.cleanup()

    def create_link(self, target_url="https://example.com/path#section", code="demo"):
        return self.client.post(
            "/internal/short-links",
            headers=self.auth,
            json={"target_url": target_url, "code": code},
        )

    def test_management_api_requires_token(self):
        response = self.client.get("/internal/short-links")
        self.assertEqual(response.status_code, 401)

    def test_create_and_redirect_preserve_exact_target(self):
        response = self.create_link()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["short_url"], "https://nightingalesilence.com/go/demo")

        redirect_response = self.client.get("/go/demo?ignored=1")
        self.assertEqual(redirect_response.status_code, 302)
        self.assertEqual(redirect_response.headers["Location"], "https://example.com/path#section")
        self.assertEqual(redirect_response.headers["Cache-Control"], "no-store")

    def test_generated_code_is_safe_and_unique(self):
        first = self.client.post(
            "/internal/short-links",
            headers=self.auth,
            json={"target_url": "https://example.com/one"},
        ).get_json()
        second = self.client.post(
            "/internal/short-links",
            headers=self.auth,
            json={"target_url": "https://example.com/two"},
        ).get_json()
        self.assertRegex(first["code"], r"^[a-z0-9]{5}$")
        self.assertNotEqual(first["code"], second["code"])

    def test_custom_code_conflict_returns_409(self):
        self.assertEqual(self.create_link().status_code, 201)
        self.assertEqual(self.create_link(target_url="https://example.com/other").status_code, 409)

    def test_invalid_or_recursive_targets_are_rejected(self):
        for target_url in (
            "javascript:alert(1)",
            "https://user:pass@example.com/private",
            "https://nightingalesilence.com/go/other",
            "https://example.com:invalid/path",
            "https://example.com/path\x00suffix",
        ):
            response = self.create_link(target_url=target_url, code=None)
            self.assertEqual(response.status_code, 400)

    def test_update_disable_enable_and_delete(self):
        self.assertEqual(self.create_link().status_code, 201)

        update_response = self.client.patch(
            "/internal/short-links/demo",
            headers=self.auth,
            json={"target_url": "https://example.org/new", "enabled": False},
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertFalse(update_response.get_json()["enabled"])
        self.assertEqual(self.client.get("/go/demo").status_code, 404)

        enable_response = self.client.patch(
            "/internal/short-links/demo",
            headers=self.auth,
            json={"enabled": True},
        )
        self.assertEqual(enable_response.status_code, 200)
        self.assertEqual(self.client.get("/go/demo").status_code, 302)

        delete_response = self.client.delete(
            "/internal/short-links/demo",
            headers=self.auth,
        )
        self.assertEqual(delete_response.status_code, 204)
        self.assertEqual(self.client.get("/go/demo").status_code, 404)

    def test_list_does_not_expose_without_auth(self):
        self.assertEqual(self.create_link().status_code, 201)
        response = self.client.get("/internal/short-links", headers=self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["links"][0]["code"], "demo")


if __name__ == "__main__":
    unittest.main()
