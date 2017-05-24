#Base Image
FROM nginx

#작성자: 임호준 이메일: hjlim@gaia3d.com
MAINTAINER HOJUN LIM hjlim@gaia3d.com

#파일생성
RUN mkdir /mago3djs/

#포트 설정
EXPOSE 80

#파일추가
ADD ./mago3djs /mago3djs/  
ADD ./deafult.conf /etc/nginx/conf.d/

#mago3djs 상세 정보

LABEL title="mago3djs"
LABEL version="1.0.1"
LABEL descriptuon="Mago3d는 AEC(Architecture, Engineering, Construction) 영역과 전통적인 3차원 공간정보(3D GIS) \
를 통합적으로 관리, 가시화해 주는 차세대 3차원 플랫폼입니다."