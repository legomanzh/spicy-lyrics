import Defaults from "../../components/Global/Defaults";

const API_URL = Defaults.lyrics.api.url;

export type Job = {
    handler: string;
    args?: any;
}

export type JobResponse = {
    handler: string;
    args?: any;
    result: JobResult;
}

export type JobResult = {
    responseData: any;
    status: number;
    type: string
}

export async function SendJob(jobs: Job[], headers: any = {}): Promise<{ get(handler: string): JobResult; }> {
    const res = await fetch(`${API_URL}/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ jobs }),
    });

    if (!res.ok) throw new Error("Request failed");

    const data = await res.json();
    const results: Map<string, JobResult> = new Map();

    for (const job of data.jobs) {
        results.set(job.handler, job.result);
    }

    return {
        get(handler: string): JobResult {
            return results.get(handler);
        },
    };
}
