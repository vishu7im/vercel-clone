const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
require("dotenv").config();

const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    secretAccessKey: SECRET_ACCESS_KEY,
    accessKeyId: ACCESS_KEY_ID,
  },
});
const PROJECT_ID = process.env.PROJECT_ID;

console.log("PROJECT_ID: ", PROJECT_ID);

async function init() {
  console.log("executing script.js ");

  const outDirPath = path.join(__dirname, "output");
  console.log(`outDirPath: ${outDirPath}`);

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", (data) => {
    console.log("Logs : ", data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error : ", data.toString());
  });

  p.on("close", async function (code) {
    console.log(`Build process exited with code ${code}`);
    if (code !== 0) {
      console.error("Build process failed");
      return;
    }
    console.log("Build Complete ");

    const buildDir = path.join(__dirname, "output", "build");
    const distDir = path.join(__dirname, "output", "dist");

    let distDirPath;

    if (fs.existsSync(buildDir)) {
      distDirPath = buildDir;
    } else if (fs.existsSync(distDir)) {
      distDirPath = distDir;
    }

    const distDirContent = fs.readdirSync(distDirPath, { recursive: true });

    for (const file of distDirContent) {
      const filePath = path.join(distDirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      // uplaod to s3
      console.log("Upload to S3 : " + filePath);

      const cmd = new PutObjectCommand({
        Bucket: "vercel-clone-source",
        Key: `__output/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });
      await s3Client.send(cmd);
    }
  });
}

init();
