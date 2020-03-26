import logo from 'ic:canisters/logo';
import * as UI from './idl-ui';
import './logo.css';

const N = 600;

async function render(ctx) {
  const res = await logo.output();
  const objects = res[0];
  const x = res[1].toNumber();
  const y = res[2].toNumber();
  const dir = res[3].toNumber();
  ctx.clearRect(0, 0, N, N);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  for (const obj of objects) {
    const start = obj.line.start;
    const end = obj.line.end;
    ctx.beginPath();  
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };
  
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 4;
  ctx.translate(x,y);
  ctx.rotate(-dir*Math.PI/180);
  ctx.beginPath();
  ctx.moveTo(-20,-20);
  ctx.lineTo(0,0);
  ctx.lineTo(-20,20);
  ctx.stroke();
  ctx.rotate(dir*Math.PI/180);  
  ctx.translate(-x,-y);
}

function renderUI(func, dom, ctx) {
  const inputs = [];
  const container = document.createElement('div');
  func.argTypes.forEach(arg => {
    const input = UI.renderInput(arg);
    inputs.push(input);
    input.render(container);
  });
  dom.appendChild(container);

  dom.appendChild(document.createElement('div'));
  const draw = document.createElement('button');
  draw.innerText = 'Draw';
  dom.appendChild(draw);
  draw.addEventListener('click', () => {
    const args = inputs.map(arg => arg.parse());
    const isReject = inputs.some(arg => arg.isRejected());
    if (isReject) {
      return;
    }
    (async () => {
      await logo.eval(...args);
      await render(ctx);
    })();
  });
  
  dom.appendChild(document.createElement('div'));
  const clear = document.createElement('button');
  clear.innerText = 'Clear';
  dom.appendChild(clear);
  clear.addEventListener('click', () => {
    (async () => {
      await logo.eval({home:null});
      await render(ctx);
    })();
  });
}

async function init() {
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  render(ctx);
  
  const func = logo.__actorInterface()['eval'];
  const div = document.createElement('div');
  renderUI(func, div, ctx);
  document.body.appendChild(div);
}

init();
