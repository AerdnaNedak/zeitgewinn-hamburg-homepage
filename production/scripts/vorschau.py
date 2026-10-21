"""Lokale Vorschau der erzeugten Seite, verhält sich wie GitHub Pages:
fehlende Adressen bekommen 404.html mit Status 404.

    python3 production/scripts/vorschau.py [port]
"""
import http.server, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, '404.html')
        if code == 404 and os.path.exists(page):
            body = open(page, 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().send_error(code, message, explain)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8411
print(f'Vorschau auf http://localhost:{port}', flush=True)
http.server.ThreadingHTTPServer(('', port), Handler).serve_forever()
