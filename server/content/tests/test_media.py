"""Media upload tests — T018 [US1]."""
from __future__ import annotations
import io,json,os,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent.parent.parent))
from server.content import config
from server.content.media import validate_and_store,MediaValidationError,check_cdn_accessibility

class MediaValidationUnitTests(unittest.TestCase):
    def test_valid_png(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(100,100),"red").save(b,"PNG")
        o=validate_and_store(b.getvalue(),"test.png")
        self.assertIn("id",o); self.assertEqual(o["mediaType"],"image/png")
        self.assertEqual(o["status"],"STAGED"); self.assertNotIn("hash",o); self.assertNotIn("originalName",o)

    def test_valid_jpg(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(50,50),"blue").save(b,"JPEG")
        o=validate_and_store(b.getvalue(),"test.jpg")
        self.assertEqual(o["mediaType"],"image/jpeg")

    def test_svg_rejected(self):
        with self.assertRaises(MediaValidationError) as cm:
            validate_and_store(b'<svg></svg>',"t.svg")
        self.assertEqual(cm.exception.code,"NOT_IMAGE")

    def test_exe_rejected(self):
        with self.assertRaises(MediaValidationError):
            validate_and_store(b'MZ\x90\x00'+bytes(100),"t.png")

    def test_too_large(self):
        with self.assertRaises(MediaValidationError) as cm:
            validate_and_store(bytes(21*1024*1024),"b.png")
        self.assertEqual(cm.exception.code,"BYTES_EXCEEDED")

    def test_too_many_pixels(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(9000,9000),"green").save(b,"PNG")
        with self.assertRaises(MediaValidationError) as cm:
            validate_and_store(b.getvalue(),"h.png")
        self.assertIn(cm.exception.code,("PIXELS_EXCEEDED","DIMENSIONS_EXCEEDED"))

    def test_bad_format(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(10,10)).save(b,"BMP")
        with self.assertRaises(MediaValidationError) as cm:
            validate_and_store(b.getvalue(),"t.bmp")
        self.assertEqual(cm.exception.code,"BAD_FORMAT")


class MediaApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from server.content.app import app as real_app
        cls.app=real_app; real_app.config['TESTING']=True; real_app.config['SERVER_NAME']='127.0.0.1:8770'

    def _h(self): return {'X-Content-Studio-Token':config.get_token(),'Origin':'http://127.0.0.1:5175','Host':'127.0.0.1:8770'}

    def test_upload_png(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(16,16),"red").save(b,"PNG")
        r=self.app.test_client().post('/api/content-studio/media',data=b.getvalue(),
            headers={**self._h(),'Content-Type':'application/octet-stream','X-File-Name':'t.png'})
        self.assertEqual(r.status_code,201)
        d=json.loads(r.data); self.assertIn("id",d); self.assertEqual(d["mediaType"],"image/png")
        self.assertNotIn("hash",d); self.assertNotIn("originalName",d)

    def test_upload_no_auth(self):
        r=self.app.test_client().post('/api/content-studio/media',data=b'x',headers={'Content-Type':'application/octet-stream'})
        self.assertEqual(r.status_code,401)


    def test_raw_media_returns_binary(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(16,16),"red").save(b,"PNG")
        o=validate_and_store(b.getvalue(),"t.png")
        r=self.app.test_client().get(f'/api/content-studio/media/{o["id"]}/raw',headers=self._h())
        self.assertEqual(r.status_code,200)
        self.assertTrue(len(r.data) > 0)
    def test_checks_stableUrl_is_true(self):
        from PIL import Image
        b=io.BytesIO(); Image.new("RGB",(16,16),"red").save(b,"PNG")
        o=validate_and_store(b.getvalue(),"t.png")
        r=self.app.test_client().post(f'/api/content-studio/media/{o["id"]}/checks',headers=self._h())
        self.assertEqual(r.status_code,201)
        d=json.loads(r.data)
        # stableUrl = True for unsigned HTTPS CDN URL regardless of HEAD result
        self.assertIs(d["result"]["stableUrl"],True)

if __name__=='__main__': unittest.main()
