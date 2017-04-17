
clc;
clear all;

nNodes = 200;
nodes = cell(4,1);
for i = 1:4
    nodes{i} = randi(2^i,[nNodes,1]);
end

radius = 5.0;
center = [0,0,0];
ng = 300; 
h =10/ng;

% 2 hemispheres

zUp = 0:h:5;
zDown = -5:h:0;


nSplits = 8;
coneH = radius+1;
coneAngle = 360/nSplits/2/2;
coneR = coneH * tand(coneAngle);

% figure;
% hold on
% [X,Y,Z] = meshgrid(-5:h:5,-5:h:5,zUp);
% F = (X).^2 + (Y).^2 + (Z).^2 - radius^2;
% patch(isosurface(X,Y,Z,F,0,'verbose'),'Facecolor','r','EdgeColor','none','FaceAlpha',0.4);
% cone([0,0,0], coneH*[0,0,1],[0,coneR],32,'r',0,0,0.2)
% circle(radius*sind(coneAngle),radius*cosd(coneAngle)*[0,0,1],[1,0,0],[0,1,0])
% 
% 
% [X,Y,Z] = meshgrid(-5:h:5,-5:h:5,zDown);
% F = (X).^2 + (Y).^2 + (Z).^2 - radius^2;
% patch(isosurface(X,Y,Z,F,0,'verbose'),'Facecolor','b','EdgeColor','none','FaceAlpha',0.4);
% cone([0,0,0], coneH*[0,0,-1],[0,coneR],32,'b',0,0,0.2)
% circle(radius*sind(coneAngle),radius*cosd(coneAngle)*[0,0,-1],[1,0,0],[0,1,0])
% 
% lighting phong
% view(3); axis image; grid on;

%%
colors = ['r','g','b','y','c','m','k','g','r','g','b','y','c','m','k','g','r','g','b','y','c','m','k','g'];
figure;
hold on

[v, f] = createTetrahedron;
% [v, f] = createCube;
% [v, f] = createOctahedron;
[v, f] = createDodecahedron;
% [v, f] = createIcosahedron;

v = (v - repmat(mean(v),[size(v,1) 1]));
v = v./repmat(sqrt(sum(v.^2,2)),[1,3]);

nSplits = size(f,1);
face = v(f(1,:),:);
coneAxis = mean(face);
coneAxis = coneAxis./norm(coneAxis);
phi = rad2deg(abs(acos(dot(face(1,:), face(2,:)))));
largestPolydron = radius/cosd(phi/2);
theta = rad2deg(abs(acos(dot(coneAxis, face(1,:)))));
outerR = sqrt( (largestPolydron*sind(theta))^2 - (largestPolydron*norm(face(1,:)-face(2,:))/2)^2);

% u = (face(1,:)+face(2,:))/2;
% psi = rad2deg(abs(acos(dot(u, coneAxis))));
% note that theta = psi since the outer triangle of the polyhydron is
coneAngle = theta*0.6;
coneH = radius*cosd(coneAngle/2);
coneR = radius*sind(coneAngle/2);    
% drawMesh(v, f, 'FaceAlpha',0.3);
drawMesh(v*largestPolydron, f, 'FaceAlpha',0.1);

% prepare sphere coordinates
[X,Y,Z] = sphere(ng);
X = X*radius;
Y = Y*radius;
Z = Z*radius;

for i = 1:8
    face = v(f(i,:),:);
    coneAxis = mean(face);
    coneAxis = coneAxis./norm(coneAxis);
%     cone([0,0,0], coneH*coneAxis,[0,coneR],32,'k',0,0,0.6);
%     cone([0,0,0], largestPolydron*cosd(theta)*coneAxis,[0,outerR],32,'k',0,0,0.4);

    % inner circle
    v1 = face(1,:)-face(2,:);
    v1 = v1/norm(v1);
    v2 = cross(coneAxis,v1);
    center = coneH*coneAxis;
    circle(coneR,center,v1,v2)
    
    % get the nodes
    if (i < 17)
        nNodes = sum(nodes{3} == i);
        points = sunflower(nNodes,2,coneR,center,v1,v2);
        % put the points on the sphere's surface
        points = points./repmat(sqrt(sum(points.^2,2)), [1,3]);
        points = radius*points;
        plot3(points(:,1),points(:,2),points(:,3),'*');        
    end

    % outer circle
%     circle(outerR,largestPolydron*cosd(theta)*coneAxis,v1,v2)

    % determine the part of the sphere to draw
    % the face is made of n edges, determine each point is on which side of
    % the planes made with the origin and the edges
    % first plane
    nFaces = size(face,1);
    idx = ones(size(X));
    for j = 1:nFaces
        % perp.(P-P0) -> P0 = [0,0,0]
        perp = cross(face(j,:),face(mod(j,nFaces)+1,:));
        res = perp(1)*X + perp(2)*Y + perp(3)*Z;
        idx = idx & (res>=0);
    end
        
    XX = X;    XX(~idx) = 0;
    YY = Y;    YY(~idx) = 0;
    ZZ = Z;    ZZ(~idx) = 0;
    
    surface(XX,YY,ZZ,'Facecolor',colors(i),'EdgeColor','none','FaceAlpha',0.4);
end

axis image equal; grid off;
set(findobj(gcf, 'type','axes'), 'Visible','off')

