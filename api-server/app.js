const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
require("dotenv").config();
const app = express();

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

app.listen(PORT, () => {
  console.info(`[server]:[${PORT}] API server`);
});
