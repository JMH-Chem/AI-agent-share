// API 키 없이 화면·로그·한도 기능을 시험해 볼 때 쓰는 가짜 응답기 (MOCK_PROVIDER=true).
import { config } from '../config.js';

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('취소됨'));
    });
  });

export const mockChat = {
  id: 'mock',
  label: '테스트용 가짜 AI',
  kind: 'chat',
  available: () => config.mockProvider,
  model: () => 'mock',

  async *run({ history, userText, signal }) {
    yield { type: 'tool', name: 'web_search', input: { query: userText.slice(0, 40) } };
    const reply =
      `**테스트 응답입니다.** 실제 AI는 호출하지 않았습니다.\n\n` +
      `- 받은 질문: ${userText}\n- 이 대화의 이전 메시지 수: ${history.length}\n\n` +
      '```js\nconsole.log("코드 블록 표시 확인");\n```';
    let text = '';
    for (const chunk of reply.match(/[\s\S]{1,12}/g)) {
      await sleep(20, signal);
      text += chunk;
      yield { type: 'text', delta: chunk };
    }
    yield {
      type: 'done',
      text,
      model: 'mock',
      usage: { input: userText.length, output: text.length },
      costUsd: 0,
      meta: { steps: [{ type: 'tool', name: 'web_search', input: { query: userText.slice(0, 40) } }], sources: [] },
    };
  },
};
