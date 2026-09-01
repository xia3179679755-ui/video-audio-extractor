"""Windows launcher for the self-contained audio extractor."""

from __future__ import annotations

import sys
import tempfile
import threading
import traceback
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tkinter import Button, Label, Tk


class LocalFileHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        return


def bundled_root() -> Path:
    return Path(getattr(sys, "_MEIPASS", Path(__file__).parent))


def main() -> None:
    root_dir = bundled_root()
    handler = partial(LocalFileHandler, directory=str(root_dir))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    address = f"http://127.0.0.1:{server.server_port}/"
    threading.Thread(target=server.serve_forever, daemon=True).start()

    def open_tool() -> None:
        webbrowser.open(address, new=2)

    window = Tk()
    window.title("音轨提取器")
    window.geometry("360x180")
    window.resizable(False, False)
    window.configure(bg="#f5f7f6")

    Label(window, text="音轨提取器正在运行", font=("Microsoft YaHei", 15, "bold"), bg="#f5f7f6", fg="#162021").pack(pady=(34, 8))
    Label(window, text="关闭此窗口会停止本地转换服务。", font=("Microsoft YaHei", 9), bg="#f5f7f6", fg="#687575").pack()
    Button(window, text="打开音轨提取器", command=open_tool, font=("Microsoft YaHei", 10, "bold"), bg="#05786f", fg="white", activebackground="#035e57", activeforeground="white", relief="flat", padx=18, pady=7, cursor="hand2").pack(pady=20)

    open_tool()
    window.mainloop()
    server.shutdown()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        error_log = Path(tempfile.gettempdir()) / "AudioExtractor-launcher-error.log"
        error_log.write_text(traceback.format_exc(), encoding="utf-8")
        raise
