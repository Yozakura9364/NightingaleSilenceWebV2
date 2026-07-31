"""Security tests for content-studio loopback API — includes request-context decorator tests."""
from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from server.content import config, schema


class TokenSecurityTests(unittest.TestCase):
    def test_generate_token_is_hex_string(self):
        token = config.generate_startup_token()
        self.assertEqual(len(token), 64)

    def test_token_stable_within_session(self):
        t1 = config.get_token()
        t2 = config.get_token()
        self.assertEqual(t1, t2)


class SchemaValidationTests(unittest.TestCase):
    def test_plain_text_without_marks_is_valid(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "hello"}]}
        ]}}
        schema.validate_document_body(doc)  # must not raise

    def test_text_with_null_marks_rejected(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "x", "marks": None}]}
        ]}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "SCHEMA_ERROR")

    def test_blockquote_cannot_contain_listItem(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "blockquote", "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "x"}]}]}
            ]}
        ]}}
        with self.assertRaises(schema.SchemaValidationError):
            schema.validate_document_body(doc)

    def test_codeBlock_with_null_child(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "codeBlock", "content": [None]}
        ]}}
        with self.assertRaises(schema.SchemaValidationError):
            schema.validate_document_body(doc)

    def test_valid_minimal_document(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": []}}
        schema.validate_document_body(doc)

    def test_paragraph_attrs_null_rejected(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "attrs": None, "content": [{"type": "text", "text": "x"}]}
        ]}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "SCHEMA_ERROR")

    def test_orderedList_attrs_null_rejected(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "orderedList", "attrs": None, "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "x"}]}]}
            ]}
        ]}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "SCHEMA_ERROR")

    def test_tableCell_cannot_contain_listItem(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "table", "content": [
                {"type": "tableRow", "content": [
                    {"type": "tableCell", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "x"}]}]}
                    ]}
                ]}
            ]}
        ]}}
        with self.assertRaises(schema.SchemaValidationError):
            schema.validate_document_body(doc)

    def test_paragraph_without_attrs_is_valid(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "x"}]}
        ]}}
        schema.validate_document_body(doc)

    def test_paragraph_content_null_rejected(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": None}
        ]}}
        with self.assertRaises(schema.SchemaValidationError):
            schema.validate_document_body(doc)

    def test_codeBlock_content_null_rejected(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "codeBlock", "content": None}
        ]}}
        with self.assertRaises(schema.SchemaValidationError):
            schema.validate_document_body(doc)

    def test_missing_schema_version(self):
        doc = {"doc": {"type": "doc", "content": []}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "MISSING_SCHEMA_VERSION")

    def test_unknown_schema_version(self):
        doc = {"schemaVersion": "content.document.v99", "doc": {"type": "doc", "content": []}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "UNKNOWN_VERSION")

    def test_extra_top_level_field(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": []}, "extraField": "no"}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "SCHEMA_ERROR")

    def test_unknown_node_rejected_by_schema(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [{"type": "script"}]}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc)
        self.assertEqual(cm.exception.code, "SCHEMA_ERROR")

    def test_oversized_body(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [{"type": "paragraph"}] * 6000}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc, max_bytes=1000)
        self.assertEqual(cm.exception.code, "OVERSIZED_BODY")

    def test_too_many_nodes(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [{"type": "paragraph"}] * 20}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc, max_nodes=10)
        self.assertEqual(cm.exception.code, "MAX_NODES")

    def test_max_depth_respected(self):
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": []}}
        schema.validate_document_body(doc, max_depth=2)  # minimal valid doc has depth 2

    def test_node_count_uses_passed_max(self):
        nodes = [{"type": "paragraph"} for _ in range(5)]
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": nodes}}
        with self.assertRaises(schema.SchemaValidationError) as cm:
            schema.validate_document_body(doc, max_nodes=3)
        self.assertEqual(cm.exception.code, "MAX_NODES")


class ConfigTests(unittest.TestCase):
    def test_bind_host_is_localhost(self):
        self.assertEqual(config.BIND_HOST, "127.0.0.1")

    def test_allowed_origins_are_local(self):
        for origin in config.ALLOWED_ORIGINS:
            self.assertTrue('localhost' in origin or '127.0.0.1' in origin)

    def test_allowed_methods_no_dangerous(self):
        self.assertNotIn("TRACE", config.ALLOWED_METHODS)


class SecurityDecoratorTests(unittest.TestCase):
    """Test real server.content.app routes and error handlers."""

    @classmethod
    def setUpClass(cls):
        from server.content.app import app as real_app
        cls.app = real_app
        cls.app.config['TESTING'] = True
        cls.app.config['SERVER_NAME'] = '127.0.0.1:8770'

    def test_health_returns_ok(self):
        with self.app.test_client() as client:
            resp = client.get('/api/content-studio/health')
            self.assertEqual(resp.status_code, 200)
            data = json.loads(resp.data)
            self.assertEqual(data['ok'], True)
            self.assertEqual(data['service'], 'content-studio')

    def test_unknown_route_returns_404_json(self):
        with self.app.test_client() as client:
            resp = client.get('/api/content-studio/nonexistent')
            self.assertEqual(resp.status_code, 404)
            data = json.loads(resp.data)
            self.assertEqual(data['error']['code'], 'NOT_FOUND')

    def test_wrong_method_returns_405_json(self):
        with self.app.test_client() as client:
            resp = client.get('/api/content-studio/test-secured')
            self.assertEqual(resp.status_code, 405)
            data = json.loads(resp.data)
            self.assertEqual(data['error']['code'], 'METHOD_NOT_ALLOWED')

    def test_missing_token_returns_401(self):
        with self.app.test_client() as client:
            resp = client.post(
                '/api/content-studio/test-secured', json={},
                headers={'Host': '127.0.0.1:8770'}
            )
            self.assertEqual(resp.status_code, 401)

    def test_wrong_token_returns_401(self):
        with self.app.test_client() as client:
            resp = client.post(
                '/api/content-studio/test-secured', json={},
                headers={'X-Content-Studio-Token': 'wrong', 'Host': '127.0.0.1:8770'}
            )
            self.assertEqual(resp.status_code, 401)
            data = json.loads(resp.data)
            self.assertEqual(data['error']['code'], 'UNAUTHORIZED')

    def test_no_token_returns_401(self):
        with self.app.test_client() as client:
            resp = client.post(
                '/api/content-studio/test-secured', json={},
                headers={'Host': '127.0.0.1:8770'}
            )
            self.assertEqual(resp.status_code, 401)

    def test_wrong_origin_rejected(self):
        token = config.get_token()
        with self.app.test_client() as client:
            resp = client.post(
                '/api/content-studio/test-secured', json={},
                headers={
                    'X-Content-Studio-Token': token,
                    'Origin': 'http://evil.com',
                    'Host': '127.0.0.1:8770'
                }
            )
            self.assertEqual(resp.status_code, 403)

    def test_valid_token_passes(self):
        token = config.get_token()
        with self.app.test_client() as client:
            resp = client.post(
                '/api/content-studio/test-secured',
                json={},
                headers={
                    'X-Content-Studio-Token': token,
                    'Origin': 'http://127.0.0.1:5175',
                    'Host': '127.0.0.1:8770'
                }
            )
            self.assertEqual(resp.status_code, 200)

    def test_oversized_body_returns_413(self):
        token = config.get_token()
        big = {'x': 'A' * (config.MAX_BODY_BYTES + 1000)}
        with self.app.test_client() as client:
            resp = client.post(
                '/api/content-studio/test-secured',
                data=json.dumps(big),
                content_type='application/json',
                headers={
                    'X-Content-Studio-Token': token,
                    'Origin': 'http://127.0.0.1:5175',
                    'Host': '127.0.0.1:8770'
                }
            )
            self.assertEqual(resp.status_code, 413)

    def test_path_outside_prefix_returns_404(self):
        with self.app.test_client() as client:
            resp = client.get('/other/path')
            self.assertEqual(resp.status_code, 404)


if __name__ == '__main__':
    unittest.main()
