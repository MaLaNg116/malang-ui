import { test as base, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { createServer } from 'node:http';
import type { IncomingHttpHeaders, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

interface Reception { method?: string; headers: IncomingHttpHeaders; body: Buffer; response: ServerResponse }
interface Receiver { url: string; count: () => number; next: () => Promise<Reception>; respond: (request: Reception, status: number, body: unknown) => void }
const test = base.extend<{ browserErrors: string[]; receiver: Receiver }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror',error=>errors.push(error.message)); page.on('console',message=>{if(message.type()==='warning'&&message.text().includes('[Vue warn]'))errors.push(message.text());}); await use(errors); expect(errors).toEqual([]); }, {auto:true}],
  receiver: async ({ baseURL }, use) => {
    const queued: Reception[] = [], waiting: ((request: Reception)=>void)[] = []; let count=0;
    const server=createServer((request,response)=>{
      response.setHeader('Access-Control-Allow-Origin',baseURL!); response.setHeader('Access-Control-Allow-Credentials','true'); response.setHeader('Access-Control-Allow-Methods','POST,PUT,PATCH,OPTIONS'); response.setHeader('Access-Control-Allow-Headers',request.headers['access-control-request-headers']||'X-Archive,Content-Type');
      if(request.method==='OPTIONS'){response.writeHead(204);response.end();return;}
      const chunks: Buffer[]=[];request.on('data',chunk=>chunks.push(Buffer.from(chunk)));request.on('end',()=>{count++;const value={method:request.method,headers:request.headers,body:Buffer.concat(chunks),response};const waiter=waiting.shift();if(waiter)waiter(value);else queued.push(value);});
    });
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve)); const port=(server.address() as AddressInfo).port;
    try { await use({url:`http://127.0.0.1:${port}`,count:()=>count,next:()=>queued.length?Promise.resolve(queued.shift()!):new Promise(resolve=>waiting.push(resolve)),respond:(request,status,body)=>{request.response.writeHead(status,{'Content-Type':'application/json'});request.response.end(JSON.stringify(body));}}); }
    finally { server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve())); }
  },
});
async function open(page: Page, story: string, globals='theme:light;motion:reduced') {
  const entries=Object.values((await(await page.request.get('/index.json')).json()).entries) as {id:string;title:string;type:string;exportName?:string}[];
  const suffix=story.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase(),entry=entries.find(item=>item.type==='story'&&item.title==='二级组件/Upload 本地文件'&&(item.exportName===story||item.id.endsWith('--'+suffix)));expect(entry).toBeDefined();
  await page.goto('/iframe.html?'+new URLSearchParams({id:entry!.id,viewMode:'story',globals}));await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const payload=(name:string,size=256*1024)=>({name,mimeType:'text/plain',buffer:Buffer.alloc(size,120)});
const row=(page:Page,name:string)=>page.locator('.ui-upload__file').filter({has:page.getByText(name,{exact:true})});

test('sends real multipart bytes with headers and credentials, reports native wire progress and retries an HTTP failure without replacing FileList',async({page,context,baseURL,receiver})=>{
  await context.addCookies([{name:'upload-session',value:'local-test',url:baseURL!}]);
  await page.route('**/__malang-upload__/manual',route=>route.continue({url:receiver.url+'/manual'}));
  await open(page,'RemoteManual');const picker=page.getByLabel('服务器附件',{exact:true}),file=payload('archive-wire.txt',1024*1024);await picker.setInputFiles(file);
  const entry=row(page,file.name);await expect(entry).toHaveAttribute('data-status','ready');expect(receiver.count()).toBe(0);
  await entry.getByRole('button',{name:'上传文件：'+file.name,exact:true}).click();const first=await receiver.next();
  expect(first.method).toBe('PUT');expect(first.headers['x-archive']).toBe('manual');expect(first.headers.cookie).toContain('upload-session=local-test');expect(first.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);
  const body=first.body.toString('utf8');expect(body).toContain('name="asset"; filename="archive-wire.txt"');expect(body).toContain('name="collection"');expect(body).toContain('demo');expect(body).toContain('paper');expect(body).toContain('ink');expect(first.body.includes(file.buffer)).toBe(true);
  await expect.poll(async()=>Number((await page.locator('[data-remote-result]').innerText()).match(/进度事件 (\d+)/)?.[1]||0)).toBeGreaterThan(0);
  await expect(entry).toHaveAttribute('data-status','uploading');await expect(page.locator('[data-remote-result]')).toContainText('成功 0');await expect(entry.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
  receiver.respond(first,503,{message:'retry'});await expect(entry).toHaveAttribute('data-status','error');await expect(entry.getByText('上传失败（HTTP 503）。',{exact:true})).toBeVisible();
  await entry.getByRole('button',{name:'重试上传：'+file.name,exact:true}).click();const second=await receiver.next();expect(second.body.includes(file.buffer)).toBe(true);receiver.respond(second,201,{id:'archive-1'});
  await expect(entry).toHaveAttribute('data-status','success');await expect(page.locator('[data-remote-result]')).toContainText('开始 2 · 成功 1 · 失败 1');await expect(page.locator('[data-remote-response]')).toContainText('archive-1');
  expect(await picker.evaluate(element=>Array.from((element as HTMLInputElement).files!).map(file=>({name:file.name,size:file.size})))).toEqual([{name:file.name,size:file.buffer.length}]);
});

test('cancels files independently and aborts accepted removal, disabling and unmount without a late success',async({page,receiver})=>{
  await page.route('**/__malang-upload__/automatic',route=>route.continue({url:receiver.url+'/automatic'}));await open(page,'RemoteAutomatic');const picker=page.getByLabel('自动远程附件',{exact:true});
  await picker.setInputFiles([payload('cancel-a.txt'),payload('keep-b.txt')]);const received=[await receiver.next(),await receiver.next()],a=received.find(item=>item.body.includes(Buffer.from('cancel-a.txt')))! ,b=received.find(item=>item.body.includes(Buffer.from('keep-b.txt')))!;
  await row(page,'cancel-a.txt').getByRole('button',{name:'取消上传：cancel-a.txt',exact:true}).click();await expect(row(page,'cancel-a.txt')).toHaveAttribute('data-status','aborted');await expect.poll(()=>a.response.destroyed).toBe(true);
  await expect(row(page,'keep-b.txt')).toHaveAttribute('data-status','uploading');receiver.respond(b,200,{ok:true});await expect(row(page,'keep-b.txt')).toHaveAttribute('data-status','success');await expect(page.locator('[data-remote-result]')).toHaveText('成功 1 · 取消 1');
  await row(page,'cancel-a.txt').getByRole('button',{name:'重试上传：cancel-a.txt',exact:true}).click();const disabled=await receiver.next();await page.getByRole('switch',{name:'禁用远程上传',exact:true}).check();await expect.poll(()=>disabled.response.destroyed).toBe(true);await expect(picker).toBeDisabled();await expect(row(page,'cancel-a.txt')).toHaveAttribute('data-status','aborted');
  const retry = row(page, 'cancel-a.txt').getByRole('button', { name: '重试上传：cancel-a.txt', exact: true });
  const remove = page.getByRole('button', { name: '移除本地文件：cancel-a.txt', exact: true });
  await expect(retry).toBeDisabled();
  await expect(remove).toBeDisabled();
  await page.getByRole('switch', { name: '禁用远程上传', exact: true }).uncheck();
  await expect(picker).toBeEnabled();
  await expect(retry).toBeEnabled();
  await expect(remove).toBeEnabled();
  await retry.click();
  const removed = await receiver.next();
  await remove.click();
  await expect.poll(() => removed.response.destroyed).toBe(true);
  await expect(row(page, 'cancel-a.txt')).toHaveCount(0);
  expect(await picker.evaluate(element=>Array.from((element as HTMLInputElement).files!).map(file=>file.name))).toEqual(['keep-b.txt']);
  await picker.setInputFiles(payload('unmount-c.txt'));const unmounted=await receiver.next();const before=await page.locator('[data-remote-result]').innerText();await page.getByRole('button',{name:'卸载远程上传',exact:true}).click();await expect.poll(()=>unmounted.response.destroyed).toBe(true);await expect(picker).toHaveCount(0);await expect(page.locator('[data-remote-result]')).toHaveText(before);
});

test('isolates a custom transport that ignores cancellation from the next attempt and keeps unknown progress indeterminate',async({page})=>{
  const held: Route[]=[],listeners:(()=>void)[]=[];await page.route('**/__malang-upload__/custom',async route=>{held.push(route);listeners.shift()?.();});
  const next=()=>held.length?Promise.resolve(held.shift()!):new Promise<Route>(resolve=>{listeners.push(()=>resolve(held.shift()!));});
  await open(page,'CustomTransport');await page.getByRole('switch',{name:'传输故意忽略取消信号',exact:true}).check();const picker=page.getByLabel('自定义远程附件',{exact:true});await picker.setInputFiles(payload('late-custom.txt',48));const entry=row(page,'late-custom.txt');
  await entry.getByRole('button',{name:'上传文件：late-custom.txt',exact:true}).click();const old=await next();expect(old.request().postDataBuffer()).toEqual(payload('late-custom.txt',48).buffer);await expect(entry.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  await entry.getByRole('button',{name:'取消上传：late-custom.txt',exact:true}).click();await expect(entry).toHaveAttribute('data-status','aborted');await entry.getByRole('button',{name:'重试上传：late-custom.txt',exact:true}).click();const current=await next();
  await old.fulfill({contentType:'application/json',body:'{"id":"old"}'});await expect(entry).toHaveAttribute('data-status','uploading');await expect(page.locator('[data-remote-result]')).toHaveText('成功 0 · 失败 0 · 取消 1');
  await current.fulfill({contentType:'application/json',body:'{"id":"current"}'});await expect(entry).toHaveAttribute('data-status','success');await expect(page.locator('[data-remote-result]')).toHaveText('成功 1 · 失败 0 · 取消 1');
});

test('waits for controlled File acceptance before networking and wraps real remote controls at 360px without changing the local default',async({page})=>{
  let requests=0,release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);await page.route('**/__malang-upload__/controlled',async route=>{requests++;await gate;await route.fulfill({contentType:'application/json',body:'{"ok":true}'});});
  try {
  await open(page,'RemoteControlled');const picker=page.getByLabel('受控远程附件',{exact:true});
  for(let attempt=1;attempt<=2;attempt++){await picker.setInputFiles(payload('declined.txt',8));await expect(page.locator('[data-remote-result]')).toHaveText(`父级请求 ${attempt} · 启动上传 0`);expect(requests).toBe(0);expect(await picker.evaluate(element=>(element as HTMLInputElement).files!.length)).toBe(0);}
  await page.getByRole('switch',{name:'接受远程文件更新',exact:true}).check();await picker.setInputFiles(payload('accepted.txt',8));await expect.poll(()=>requests).toBe(1);await expect(row(page,'accepted.txt')).toHaveAttribute('data-status','uploading');
  await page.getByRole('switch',{name:'接受远程文件更新',exact:true}).uncheck();await page.getByRole('button',{name:'移除本地文件：accepted.txt',exact:true}).click();await expect(row(page,'accepted.txt')).toHaveAttribute('data-status','uploading');release();await expect(row(page,'accepted.txt')).toHaveAttribute('data-status','success');
  } finally { release(); }
  await page.setViewportSize({width:360,height:780});const name='ArchiveWithoutArtificialClipping'.repeat(4)+'.txt';await open(page,'RemoteManual','theme:dark;motion:reduced');await page.getByLabel('服务器附件',{exact:true}).setInputFiles(payload(name,8));
  const button=page.getByRole('button',{name:'上传文件：'+name,exact:true});const box=(await button.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360);
  await open(page,'Default');let localRequests=0;page.on('request',request=>{if(request.url().includes('/__malang-upload__/'))localRequests++;});await page.getByLabel('归档附件',{exact:true}).setInputFiles({name:'local.pdf',mimeType:'application/pdf',buffer:Buffer.from('local')});await expect(page.getByText('本地待处理',{exact:true})).toBeVisible();expect(localRequests).toBe(0);await expect(page.locator('.ui-upload__request-actions')).toHaveCount(0);
});
