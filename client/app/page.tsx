"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { Fira_Code } from "next/font/google";
import axios from "axios";

const socket = io("http://localhost:9002");

const firaCode = Fira_Code({ subsets: ["latin"] });

export default function Home() {
  const [repoURL, setURL] = useState<string>("");

  const [logs, setLogs] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [projectId, setProjectId] = useState<string | undefined>();
  const [deployPreviewURL, setDeployPreviewURL] = useState<
    string | undefined
  >();

  const logContainerRef = useRef<HTMLElement>(null);

  const isValidURL: [boolean, string | null] = useMemo(() => {
    if (!repoURL || repoURL.trim() === "") return [false, null];
    const regex = new RegExp(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/
    );
    return [regex.test(repoURL), "Enter valid Github Repository URL"];
  }, [repoURL]);

  const handleClickDeploy = useCallback(async () => {
    setLoading(true);

    const { data } = await axios.post(`http://localhost:9000/project`, {
      gitURL: repoURL,
    });

    if (data && data.data) {
      const { project_id, url } = data.data;
      setProjectId(project_id);
      setDeployPreviewURL(url);

      console.log(`Subscribing to logs:${project_id}`);
      socket.emit("subscribe", `logs:${project_id}`);
    }
  }, [projectId, repoURL]);

  function isValidJSON(s: string) {
    try {
      JSON.parse(s);
      return true;
    } catch (e) {
      return false;
    }
  }

  const handleSocketIncommingMessage = useCallback((message: string) => {
    console.log(`[Incomming Socket Message]:`, typeof message, message);

    const isvalid = isValidJSON(message);
    console.log(isvalid);
    if (isvalid) {
      let { log } = JSON.parse(message);
      setLogs((prev) => [...prev, log]);
      logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    socket.on("message", handleSocketIncommingMessage);

    return () => {
      socket.off("message", handleSocketIncommingMessage);
    };
  }, [handleSocketIncommingMessage]);

  return (
    <main className="flex justify-center items-center h-[100vh]">
      <div className="w-[600px]">
        <span className="flex justify-start items-center gap-2">
          <Github className="text-5xl" />
          <Input
            disabled={loading}
            value={repoURL}
            onChange={(e) => setURL(e.target.value)}
            type="url"
            placeholder="Github URL"
          />
        </span>
        <Button
          onClick={handleClickDeploy}
          disabled={!isValidURL[0] || loading}
          className="w-full mt-3"
        >
          {loading ? "In Progress" : "Deploy"}
        </Button>
        {deployPreviewURL && (
          <div className="mt-2 bg-slate-900 py-4 px-2 rounded-lg">
            <p>
              Preview URL{" "}
              <a
                target="_blank"
                className="text-sky-400 bg-sky-950 px-3 py-2 rounded-lg"
                href={deployPreviewURL}
              >
                {deployPreviewURL}
              </a>
            </p>
          </div>
        )}
        {logs.length > 0 && (
          <div
            className={`${firaCode.className} text-sm text-green-500 logs-container mt-5 border-green-500 border-2 rounded-lg p-4 h-[300px] overflow-y-auto`}
          >
            <pre className="flex flex-col gap-1">
              {logs.map((log, i) => (
                <code
                  ref={logs.length - 1 === i ? logContainerRef : undefined}
                  key={i}
                >{`> ${log}`}</code>
              ))}
            </pre>
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div
            className={`${firaCode.className} scroll_remove text-sm text-green-500 logs-container mt-5 border-green-500 border-2 rounded-lg p-4 h-[300px] overflow-y-auto`}
          >
            <pre className="flex flex-col gap-1">
              {" "}
              logs: wait until code properly deploy{" "}
            </pre>

            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-200"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-400"></div>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </main>
  );
}

// TODO: on complete handle logs
