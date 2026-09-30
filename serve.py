import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8090
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"===========================================================")
        print(f" AEGIS AI CROWD INTELLIGENCE SECURITY SYSTEM")
        print(f" Real Webcam & Zero-Webcam AI Surveillance Command Center")
        print(f" Local URL:   {url}")
        print(f" Direct IP:   http://127.0.0.1:{PORT}")
        print(f" Press Ctrl+C to terminate server")
        print(f"===========================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down AEGIS Command Server.")
            sys.exit(0)

if __name__ == '__main__':
    main()
