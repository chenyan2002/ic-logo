import logo from 'ic:canisters/logo';
import * as UI from './ui';
import './logo.css';

function renderUI(dom) {  
  let container = document.createElement('div');
  UI.inputs[0].render(container);
  dom.appendChild(container);
  
  dom.appendChild(document.createElement('div'));
  const draw = document.createElement('button');  
  draw.innerText = 'Draw';
  dom.appendChild(draw);
  draw.addEventListener('click', () => {
    UI.parse(UI.inputs, false);
  });
  
  dom.appendChild(document.createElement('div'));
  const clear = document.createElement('button');
  clear.innerText = 'Clear';
  dom.appendChild(clear);
  clear.addEventListener('click', () => {
    (async () => {
      await logo.clear();
      const res = await logo.output();
      await UI.renderCanvas(res);
    })();
  });
}

async function init() {
  const left = document.createElement('div');  
  left.appendChild(UI.canvas);
  
  const right = document.createElement('div');
  renderUI(right);

  const box = document.createElement('div');
  box.style.display = 'flex';
  box.appendChild(left);
  box.appendChild(right);
  document.body.appendChild(box);

  const res = await logo.output();
  UI.renderCanvas(res);
}

init();

