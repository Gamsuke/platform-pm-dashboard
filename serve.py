import http.server, os
os.chdir("/Users/com-000055/Downloads/Project Management")
handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(("", 8080), handler)
httpd.serve_forever()
