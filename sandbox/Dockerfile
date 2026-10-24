# 에이전트 코드 실행용 이미지: 파이썬 + 수업에서 자주 쓰는 라이브러리 + 한글 글꼴
#   docker build -t class-ai-sandbox sandbox/
#   .env 에 CODE_EXEC_IMAGE=class-ai-sandbox
# 다른 라이브러리가 필요하면 아래 pip install 줄에 추가하고 다시 만드세요.
# (실행 중에는 인터넷이 막혀 있어 학생 코드에서 pip install 을 할 수 없습니다.)
FROM python:3.12-slim

RUN pip install --no-cache-dir numpy pandas matplotlib scipy sympy openpyxl koreanize-matplotlib

# 그래프에 한글이 깨지지 않도록 나눔고딕을 시스템 글꼴로 등록하고 기본 글꼴로 지정
RUN FONTS="$(python -c "import importlib.util, os; print(os.path.dirname(importlib.util.find_spec('koreanize_matplotlib').origin))")/fonts" \
 && mkdir -p /usr/share/fonts/truetype/nanum \
 && cp "$FONTS"/*.ttf /usr/share/fonts/truetype/nanum/ \
 && printf 'font.family: NanumGothic\naxes.unicode_minus: False\n' > /etc/matplotlibrc
ENV MATPLOTLIBRC=/etc/matplotlibrc
