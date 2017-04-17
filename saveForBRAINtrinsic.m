function saveForBRAINtrinsic(folder, subjectid, labels, network, topologies, clusters)
%%
% folder            output foler
% subjectid         subject identification
% labels            labels keymap, should be a column
% network           connectome
% topologies        structure of different topologies: isomap, tsne, mds
%                   should be a 3 columns array [x y z] (optional)
% clusters          structure containing clustering data like PLACE or PACE
%                   should be a column (optional)
% This function generates BRAINtrinsic compatible csv files from input. Two
% files are generated in the pointed folder: a network file and a topology
% file. The network file contains the adjacency matrix. The topology file
% contains either topology data represented in 3 consective columns or
% clustering data represented in one column.
%% checks 
if ~isempty(topologies) && ~isstruct(topologies)
    error('Topologies must be a structure with each field refer to a 3 columns array');
end
labels = labels(:);
nLabels = length(labels);
%% write network data
filename = [folder, '\NW', subjectid, '.csv'];
fprintf('Writing %s\n', filename)
csvwrite(filename, network);

%% write topology data
filename = [folder, '\topology', subjectid, '.csv'];
header = 'label';
data = labels;
if ~isempty(topologies)
    topologiesNames = fieldnames(topologies);
    for i = 1:length(topologiesNames)
        topology = topologiesNames{i};
        header = [header, ',', topology, ',,'];
        if size(topologies.(topology),2) ~= 3
            error('A topology should contain labels centroids in 3D, it must be a 3 columns array');
        end
        try
            data = [data, topologies.(topology)];
        catch
            error('Labels and Topologies should have the same number of rows');
        end
    end
end

if exist('clusters', 'var')
    clustersNames = fieldnames(clusters);
    for i = 1:length(clustersNames)
        header = [header, ',', clustersNames{i}];
        cluster = clusters.(clustersNames{i});
        if iscell(cluster)
            cluster = treeToCluster(cluster);
        end
        cluster = cluster(:);
        try
            data = [data, cluster];
        catch
            error('Labels and Clusters should have the same number of rows');
        end
    end
end

fprintf('Writing %s\n', filename)

fid = fopen(filename, 'w');
fprintf(fid, [header,'\n']);
fclose(fid)
dlmwrite(filename, data, '-append', 'precision', '%.2f', 'delimiter', ',');
end

function cluster = treeToCluster(tree)
%% This function returns an array of communities from a cell array 
% of a cell array community structure input . The input should be 
% a cell array containing vectors, each represent the indeces of 
% the nodes in the same group, the output is a row vector containing
% the group number of the corresponding index.
%%
IdxOrd = tree(end,:);
nNodes = sum(cellfun(@numel,tree(end,:)));
cluster = zeros(1,nNodes);
CommN = 1;
for j = 1:length(IdxOrd)
    if isempty(IdxOrd{j}); continue; end
    cluster(IdxOrd{j}) = CommN;
    CommN = CommN+1;
end

end