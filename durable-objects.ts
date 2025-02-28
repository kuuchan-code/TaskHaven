// /durable-objects.ts
export class SchedulerLock {
    // オブジェクトの状態（ここでは単純なフラグ）
    state: DurableObjectState;
    lock: boolean = false;
  
    constructor(state: DurableObjectState) {
      this.state = state;
    }
  
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');
  
      if (action === 'acquire') {
        if (!this.lock) {
          this.lock = true;
          return new Response("acquired", { status: 200 });
        } else {
          return new Response("locked", { status: 429 });
        }
      }
  
      if (action === 'release') {
        this.lock = false;
        return new Response("released", { status: 200 });
      }
  
      return new Response("invalid", { status: 400 });
    }
  }
  