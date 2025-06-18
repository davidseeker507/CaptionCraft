import http from "http";
import { createWriteStream, unlink } from "fs";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import Busboy from "busboy";
import ffmpegPath from "ffmpeg-static";

http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/upload") {
    try {
      const { wavPath } = await handleUpload(req);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ wavPath }));
    } catch (e) {
      res.writeHead(500).end(e.message);
    }
    return;
  }
  res.writeHead(404).end();
}).listen(3000, () => console.log("http://localhost:3000"));

async function handleUpload(req) {
  const bus = Busboy({ headers: req.headers });
  const id = randomUUID();
  const videoPath = `${tmpdir()}/${id}.mp4`;
  const wavPath   = `${tmpdir()}/${id}.wav`;

  return new Promise((resolve, reject) => {
    bus.on("file", (_, file) => pipeline(file, createWriteStream(videoPath)));
    bus.on("finish", async () => {
      try {
        await runFfmpeg(videoPath, wavPath);
        resolve({ wavPath });
      } catch (err) {
        reject(err);
      } finally {
        unlink(videoPath, () => {});
      }
    });
    req.pipe(bus);
  });
}

function runFfmpeg(input, output) {
  return new Promise((res, rej) => {
    const ff = spawn(ffmpegPath, [
      "-i", input,
      "-vn",
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      output
    ]);
    ff.stderr.pipe(process.stderr);
    ff.on("exit", code => code === 0 ? res() : rej(new Error(`ffmpeg exit ${code}`)));
  });
}
