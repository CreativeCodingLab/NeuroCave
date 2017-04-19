# NeuroCave

This is a Web-based tool allows to visualize the Connectome data that describes how the regions of the brain are 
interconnected. Particularly, the tools enable to perform the exploration of the intrinsic geometry of the brain, 
by letting the user switch quickly different topological spaces where the connectome is embedded.
With a simple and easy-to-use interface, users can explore all the connections with a edge-on-demand technique and 
focus on very specific area by switching on and off regions of the brain. Simple analytics such as nodal strength 
and shortest path trees can be computed on the fly. This tool has been developed with virtual reality in mind, it is
compatible with the Oculus Rift headset and it requires the existence of the Oculus Touch input accessory for nodal
selection. A presentation for NeuroCave can be found [here](https://dl.dropboxusercontent.com/u/571874/NeuroCave_VIS_2017.mp4).

# How to use it
NeuroCave is accessible [here](https://github.com/CreativeCodingLab/NeuroCave/) and there is no need of 
installation since it is a web-based application. Users can upload data and visualize them. The user has to point
to the folder containing all data. The folder should contain 3 types of files:
- network files: a ".csv" file per subject containing the adjacency matrix of the connectome.
- Topology files: a ".csv" file per subject containing the different topological and clustering information for each 
region. Topological information are expected to be an (x,y,z) vector for each label. Clustering information are 
expected to be an integer number starting with 1.
- index.txt: this file lists the available network and topology pair files and associate them to the subject ID.


# Virtual Reality instruction
NeuroCave is fully compatible with [Oculus Rift device](https://www.oculus.com/).

# Color coding
NeuroCave allows different color coding schemas, such as:
- Anatomy - nodes are grouped according to their neuroanatomical locations.
- Embeddedness - nodes that have been shown to be highly embedded in the human structural connectome [1] are 
highlighted.
- Rich-club - Rich-club nodes as defined in [2] are highlighted. Note that the Rich-club regions form a subset of 
highly-embedded nodes.

# Testing

NeuroCave is available [here](index.html) for online testing.

# Acknowledgment

The tool was developed by Johnson Keiriz based on Giorgio Conte's BRAINtrinsic tool. The tool belongs to the 
[Creative Coding Research Group](https://www.evl.uic.edu/creativecoding/), directed by Prof.
Angus Forbes. The research group is part of the [Electronic Visualization Lab](https://www.evl.uic.edu) (EVL) at 
University of Illinois at Chicago (UIC).
This research is being done in collaboration with Dr. Alex Leow, Dr. Olusola Ajilore, and Dr. Allen Ye, all belonging 
to UIC Department of Psychiatry. BRAINtrinsic is an integral research component of the 
[CoNECt@UIC](http://conect.brain.uic.edu), an interdisciplinary team of researchers and clinicians devoted to improving
the understanding of brain connectivity.

# References

**[1]** - Ye, A. Q., Zhan, L., Conrin, S., GadElKarim, J., Zhang, A., Yang, S., Feusner, J.D., Kumar, A., Ajilore, 
O. and Leow, A. (2015). Measuring embeddedness: Hierarchical scale‐dependent information exchange efficiency of the human brain connectome. Human Brain Mapping.

**[2]** - van den Heuvel, M. P., & Sporns, O. (2011). Rich-club organization of the human connectome. The Journal of 
neuroscience, 31(44), 15775-15786.
