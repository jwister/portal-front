/** Gateway contract: https://ztoken.cc/doc.html, video and asset APIs, checked 2026-09-14. */
export const SEEDANCE_MODELS = ['seedance-2.0', 'seedance-2.0-fast', 'seedance-2.0-mini'] as const
export const VIDEO_URL = 'https://api.ztoken.cc/v1/videos'
export const ASSET_URL = 'https://api.ztoken.cc/v1/assets'
export const ASSET_VERSION = '2024-01-01'

export function isDocumentedSeedance(model: string): boolean {
  return SEEDANCE_MODELS.some((name) => name === model)
}

export function seedancePayload(model: string) {
  return {
    model,
    content: [{ type: 'text', text: 'A first-person fruit tea commercial.' }],
    resolution: model === 'seedance-2.0-fast' ? '720p' : '480p',
    ratio: '16:9',
    duration: 5,
  }
}

export function seedanceExamples(model = 'seedance-2.0') {
  const payload = seedancePayload(model)
  const shell = "'" + JSON.stringify(payload, null, 2).replaceAll("'", "'\"'\"'") + "'"
  return {
    cURL: `curl --fail-with-body "${VIDEO_URL}" \\\n  -H "Authorization: Bearer $ZTOKEN_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shell}\n\n# Replace TASK_ID with task.id from the response.\ncurl --fail-with-body "${VIDEO_URL}/TASK_ID" \\\n  -H "Authorization: Bearer $ZTOKEN_API_KEY"`,
    Python: `# python -m pip install requests\nimport os\nimport time\nfrom urllib.parse import quote\nimport requests\n\nurl = "${VIDEO_URL}"\nheaders = {"Authorization": "Bearer " + os.environ["ZTOKEN_API_KEY"]}\npayload = ${JSON.stringify(payload, null, 4)}\nresponse = requests.post(url, headers=headers, json=payload, timeout=600)\nresponse.raise_for_status()\ntask_id = response.json()["task"]["id"]\nprint("Task ID:", task_id)\n\n# Keep this ID; poll the same task instead of submitting another paid request.\ndeadline = time.monotonic() + 600\nwhile time.monotonic() < deadline:\n    response = requests.get(url + "/" + quote(task_id, safe=""), headers=headers, timeout=60)\n    response.raise_for_status()\n    task = response.json()["task"]\n    if task["status"] == "completed":\n        print(task["content"]["video_url"])\n        break\n    if task["status"] == "failed":\n        raise RuntimeError(task)\n    if task["status"] not in ("queued", "running"):\n        raise RuntimeError("Unexpected task status: " + str(task))\n    time.sleep(5)\nelse:\n    raise TimeoutError("Keep polling the existing task: " + task_id)`,
    JavaScript: `// Node.js 20+; save as seedance.mjs\nimport { setTimeout as delay } from "node:timers/promises";\n\nconst url = "${VIDEO_URL}";\nconst apiKey = process.env.ZTOKEN_API_KEY;\nif (!apiKey) throw new Error("Set ZTOKEN_API_KEY");\nconst headers = { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" };\nasync function read(response) {\n  if (!response.ok) throw new Error(response.status + ": " + await response.text());\n  return response.json();\n}\nconst created = await read(await fetch(url, {\n  method: "POST", headers,\n  body: JSON.stringify(${JSON.stringify(payload, null, 2)}),\n  signal: AbortSignal.timeout(600000),\n}));\nconst taskId = created.task.id;\nconsole.log("Task ID:", taskId);\n\n// Keep this ID; poll the same task instead of submitting another paid request.\nconst deadline = Date.now() + 600000;\nlet completed = false;\nwhile (Date.now() < deadline) {\n  const { task } = await read(await fetch(url + "/" + encodeURIComponent(taskId), {\n    headers, signal: AbortSignal.timeout(60000),\n  }));\n  if (task.status === "completed") {\n    console.log(task.content.video_url);\n    completed = true;\n    break;\n  }\n  if (task.status === "failed" || !["queued", "running"].includes(task.status)) {\n    throw new Error(JSON.stringify(task));\n  }\n  await delay(5000);\n}\nif (!completed) throw new Error("Keep polling the existing task: " + taskId);`,
  }
}
