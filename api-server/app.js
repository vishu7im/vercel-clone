const express = require("express");
const cors = require("cors");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
require("dotenv").config();
const app = express();
const { Server } = require("socket.io");
const Redis = require("ioredis");

app.use(cors());

const PORT = 9000;

function extractUsernameRepo(url) {
  const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(\.git)?$/;
  const match = url.match(regex);
  if (match) {
    return `${match[1]}-${match[2]}`;
  } else {
    return null;
  }
}

const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const CLUSTER = process.env.CLUSTER;
const TASK = process.env.TASK;
const SUBNET1 = process.env.SUBNET1;
const SUBNET2 = process.env.SUBNET2;
const SUBNET3 = process.env.SUBNET3;
const SECURITYGROUPS = process.env.SECURITYGROUPS;

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    secretAccessKey: SECRET_ACCESS_KEY,
    accessKeyId: ACCESS_KEY_ID,
  },
});

const config = {
  CLUSTER: CLUSTER,
  TASK: TASK,
};

app.use(express.json());

app.post("/project", async (req, res) => {
  const { gitURL } = req.body;

  const project_id = extractUsernameRepo(gitURL);

  // Spin the container
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [SUBNET1, SUBNET2, SUBNET3],
        securityGroups: [SECURITYGROUPS],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "build-image",
          environment: [
            { name: "GIT_REPOSITORY__URL", value: gitURL },
            { name: "PROJECT_ID", value: project_id },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);
  https: return res.json({
    status: "queued",
    data: { project_id, url: `http://${project_id}.localhost:8000` },
  });
});

const IO_REDIS = process.env.IO_REDIS;

const subscriber = new Redis(IO_REDIS);

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9002, () => console.log("Socket Server 9002"));

async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

app.listen(PORT, () => {
  console.info(`[server]:[${PORT}] API server`);
});
