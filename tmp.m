folder = 'F:\Data\PACE\HCP\';

nw = squeeze(mean(mat1(sex==-1,:,:),1));
topology.Isomap = HCP_Isomap_female;
clusters.PACE = female_IdxOrd(5,:);
saveForBRAINtrinsic(folder, 'female', 1:200, nw, topology, clusters)

nw = squeeze(mean(mat1(sex==1,:,:),1));
topology.Isomap = HCP_Isomap_male;
clusters.PACE = male_IdxOrd(5,:);
saveForBRAINtrinsic(folder, 'male', 1:200, nw, topology, clusters)
