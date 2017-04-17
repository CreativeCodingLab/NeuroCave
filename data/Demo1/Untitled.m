% ll = unique(labels);
% nNodes = length(ll);
% NW2 = zeros(nNodes, nNodes);
% for i = 1:nNodes
%     for j = i+1:nNodes
%         idx1 = labels == ll(i);
%         idx2 = labels == ll(j);
%         NW2(i,j) = sum(sum(NW(idx1,idx2)));
%         NW2(j,i) = NW2(i,j);
%     end    
% end
% 
% % imagesc(NW2)
% 
% [IdxOrd, psi]= computeTree(NW2,4);


%%
IdxOrd2 = IdxOrd(end,:);
for i = 1:16
    cluster = IdxOrd2{i};
    newCluster = [];
    for c = 1:length(cluster)
        idx = find(labels == ll(cluster(c)));
        newCluster = [newCluster; idx];
    end
    IdxOrd2{i} = newCluster;    
end

%% 
clusters = zeros(620,1);

for i = 1:16
    clusters(IdxOrd2{i}) = i;
end
    