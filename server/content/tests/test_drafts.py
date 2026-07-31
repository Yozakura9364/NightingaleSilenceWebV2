"""Draft API tests — T017 [US1]."""
from __future__ import annotations
import json,os,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent.parent.parent))
from server.content import config

VALID_DOC={"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}}
META={"title":"Test","tags":["test"]}

class DraftApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from server.content.app import app as real_app
        cls.app=real_app; real_app.config['TESTING']=True; real_app.config['SERVER_NAME']='127.0.0.1:8770'

    def _h(self): return {'X-Content-Studio-Token':config.get_token(),'Origin':'http://127.0.0.1:5175','Host':'127.0.0.1:8770'}
    def _post(self,p,d,**x):
        return self.app.test_client().post(p,data=json.dumps(d),content_type='application/json',headers={**self._h(),**x})
    def _get(self,p,**x): return self.app.test_client().get(p,headers={**self._h(),**x})
    def _patch(self,p,d,**x):
        return self.app.test_client().patch(p,data=json.dumps(d),content_type='application/json',headers={**self._h(),**x})

    def _create(self):
        r=self._post('/api/content-studio/drafts',{"metadata":META,"document":VALID_DOC})
        self.assertEqual(r.status_code,201); d=json.loads(r.data)
        self.assertEqual(d["revision"],1); return d["id"]

    def test_create_ok(self):
        self._create()

    def test_create_no_title_422(self):
        r=self._post('/api/content-studio/drafts',{"metadata":{"title":"","tags":[]},"document":VALID_DOC})
        self.assertEqual(r.status_code,422)

    def test_create_no_tags_422(self):
        r=self._post('/api/content-studio/drafts',{"metadata":{"title":"X"},"document":VALID_DOC})
        self.assertEqual(r.status_code,422)

    def test_create_extra_field_422(self):
        r=self._post('/api/content-studio/drafts',{"metadata":{"title":"X","tags":[],"foo":"bar"},"document":VALID_DOC})
        self.assertEqual(r.status_code,422)


    def test_create_top_extra_422(self):
        r=self._post('/api/content-studio/drafts',{"metadata":META,"document":VALID_DOC,"unexpected":True})
        self.assertEqual(r.status_code,422)
    def test_create_invalid_cover_422(self):
        r=self._post('/api/content-studio/drafts',{"metadata":{"title":"X","tags":[],"coverMediaId":"not-uuid"},"document":VALID_DOC})
        self.assertEqual(r.status_code,422)

    def test_get_draft(self):
        cid=self._create()
        r=self._get(f'/api/content-studio/drafts/{cid}')
        self.assertEqual(r.status_code,200)
        d=json.loads(r.data); self.assertIn("document",d)
        self.assertEqual(d["document"]["doc"]["content"][0]["content"][0]["text"],"Hello")

    def test_save_ok(self):
        cid=self._create()
        nd={"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Updated"}]}]}}
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":1,"metadata":META,"document":nd})
        self.assertEqual(r.status_code,200); self.assertEqual(json.loads(r.data)["revision"],2)

    def test_save_missing_metadata_422(self):
        cid=self._create()
        nd={"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"U"}]}]}}
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":1,"document":nd})
        self.assertEqual(r.status_code,422)

    def test_save_rev_0_422(self):
        cid=self._create()
        nd={"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"U"}]}]}}
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":0,"metadata":META,"document":nd})
        self.assertEqual(r.status_code,422)


    def test_save_rev_true_422(self):
        cid=self._create()
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":True,"metadata":META,"document":VALID_DOC})
        self.assertEqual(r.status_code,422)

    def test_save_top_extra_422(self):
        cid=self._create()
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":1,"metadata":META,"document":VALID_DOC,"extra":1})
        self.assertEqual(r.status_code,422)
    def test_dedup(self):
        cid=self._create()
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":1,"metadata":META,"document":VALID_DOC})
        self.assertEqual(r.status_code,200); self.assertEqual(json.loads(r.data)["revision"],1)

    def test_conflict_409(self):
        cid=self._create()
        nd={"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"A"}]}]}}
        self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":1,"metadata":META,"document":nd})
        r=self._patch(f'/api/content-studio/drafts/{cid}',{"expectedRevision":1,"metadata":META,"document":nd})
        self.assertEqual(r.status_code,409)


    def test_create_unknown_node_attrs_rejected_422(self):
        # unknown attrs must be rejected by JSON Schema
        bad_doc = {"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[
            {"type":"paragraph","attrs":{"foo":None},"content":[{"type":"text","text":"x"}]}
        ]}}
        r=self._post('/api/content-studio/drafts',{"metadata":META,"document":bad_doc})
        self.assertEqual(r.status_code,422)

    def test_unknown_node_type_rejected_422(self):
        bad_doc = {"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[
            {"type":"ghostNode","content":[{"type":"text","text":"x"}]}
        ]}}
        r=self._post('/api/content-studio/drafts',{"metadata":META,"document":bad_doc})
        self.assertEqual(r.status_code,422)

    def test_save_produces_canonical_table_with_colspan(self):
        # Create draft with Tiptap-like table (has colspan, align on cells)
        # The save path should normalize via toCanonicalDocument → accepted by server
        meta = {"title":"Table Test","tags":["test"]}
        doc_with_table = {"schemaVersion":"content.document.v1","doc":{
            "type":"doc","content":[{"type":"table","content":[
                {"type":"tableRow","content":[
                    {"type":"tableHeader","attrs":{"colspan":2},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"Header"}]}]}]},
                {"type":"tableRow","content":[
                    {"type":"tableCell","content":[
                        {"type":"paragraph","content":[{"type":"text","text":"A"}]}]},
                    {"type":"tableCell","attrs":{"colwidth":[100]},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"B"}]}]}]}
            ]}]}}
        r = self._post("/api/content-studio/drafts",{"metadata":meta,"document":doc_with_table})
        self.assertEqual(r.status_code,201)
        d = json.loads(r.data)
        # Verify saved document preserves colspan and colwidth
        saved = d["document"]["doc"]["content"][0]
        header = saved["content"][0]["content"][0]
        self.assertEqual(header.get("attrs",{}).get("colspan"),2)


    def test_full_lifecycle_table_colspan_preserved(self):
        """Simulate frontend: create → save canonical table → recover → bare doc intact."""
        meta = {"title":"Lifecycle","tags":["test"]}
        # 1. Create draft with table (has colspan, colwidth — canonical fields)
        table_doc = {"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[
            {"type":"table","content":[
                {"type":"tableRow","content":[
                    {"type":"tableHeader","attrs":{"colspan":2},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"Merged Header"}]}]}]},
                {"type":"tableRow","content":[
                    {"type":"tableCell","attrs":{"colwidth":[100]},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"A"}]}]},
                    {"type":"tableCell","attrs":{"colwidth":[200]},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"B"}]}]}]}]}]}}
        r = self._post("/api/content-studio/drafts",{"metadata":meta,"document":table_doc})
        self.assertEqual(r.status_code,201)
        cid = json.loads(r.data)["id"]
        rev = json.loads(r.data)["revision"]
        self.assertEqual(rev,1)
        # 2. Save updated table (simulates editor autosave after editing)
        updated = {"schemaVersion":"content.document.v1","doc":{"type":"doc","content":[
            {"type":"table","content":[
                {"type":"tableRow","content":[
                    {"type":"tableHeader","attrs":{"colspan":2},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"Updated"}]}]}]},
                {"type":"tableRow","content":[
                    {"type":"tableCell","attrs":{"colwidth":[150]},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"C"}]}]},
                    {"type":"tableCell","attrs":{"colwidth":[250]},"content":[
                        {"type":"paragraph","content":[{"type":"text","text":"D"}]}]}]}]}]}}
        r = self._patch(f"/api/content-studio/drafts/{cid}",{"expectedRevision":1,"metadata":meta,"document":updated})
        self.assertEqual(r.status_code,200)
        self.assertEqual(json.loads(r.data)["revision"],2)
        # 3. Recover (simulates page reload / tab switch)
        r = self._get(f"/api/content-studio/drafts/{cid}")
        self.assertEqual(r.status_code,200)
        data = json.loads(r.data)
        # getDraft returns full ContentDocument; extract bare doc (simulates ContentStudioPage)
        bare_doc = data["document"]["doc"]
        # Verify canonical fields survived the save-recover roundtrip
        table = bare_doc["content"][0]
        header_cell = table["content"][0]["content"][0]
        self.assertEqual(header_cell["attrs"]["colspan"],2)
        first_data_cell = table["content"][1]["content"][0]
        self.assertEqual(first_data_cell["attrs"]["colwidth"],[150])

    def test_list(self):
        self._create()
        r=self._get('/api/content-studio/drafts?page=1&pageSize=10')
        self.assertEqual(r.status_code,200); d=json.loads(r.data)
        self.assertIn("data",d); self.assertIn("pagination",d)

if __name__=='__main__': unittest.main()
