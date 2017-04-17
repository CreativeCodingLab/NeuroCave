# BRAINtrinsic

This web-based tool allows to visualize the Connectome data that describes how the regions of the brain are interconnected.
Particularly, the tools enable to perform the exploration of the intrinsic geometry of the brain, by letting the user
 switch quickly different topological spaces where the connectome is embedded.
With a simple and easy-to-use interface, users can explore all the connections with a edge-on-demand technique and focus on
very specific area by switching on and off regions of the brain. Simple analytics such as nodal strength and shortest path
trees can be computed on the fly. This tool has been developed with virtual reality in mind and it is compatible with
Head Mounted Displays such as Oculus Rift (both DK1 and DK2).

#How to use it
The web-based tool is accessible [here](http://creativecodinglab.github.io/BRAINtrinsic/) and there is no need of installation since it is a web-based application. It has been optimized for Google Chrome Browser.
Users can upload data and visualize them. All the files needed are in ".csv" format and specifically should be structured as follows:
- Centroid files (4): each of them contains different ROI coordinates (the "centroid"). Each row of the file contains three values that represent the x,y,z coordinates. Each value is separated by a comma.
- network file: this file contains the adjacency matrix of the connectome network. Each value within the same row is separated by a comma. The tool is optimized to deal with weighted graph.
- labelkey file: each row contains the Freesurfer ID label to which the node belongs.

Before uploading the file, make sure to remove the last blank row of each file, otherwise data will not be displayed correctly.
You can find a correct dataset ready to be uploaded [here](https://github.com/CreativeCodingLab/BRAINtrinsic/tree/gh-pages/data/Demo1).
#Virtual Reality instruction
BRAINtrinsic is fully compatible with [Oculus Rift device](https://www.oculus.com/) (both DK1 and DK2).
To run BRAINtrinsic in the OR compatible mode, make sure to download [oculus-rest](https://github.com/CreativeCodingLab/BRAINtrinsic/blob/gh-pages/oculus-rest)(MAC OS users).
More information about the "oculus-rest" plugin can be found [here](https://github.com/msfeldstein/oculus-rest).
Now:
- Plug the Oculus Rift into your computer
- Launch the "oculus-rest" plugin
- Click [here](http://creativecodinglab.github.io/BRAINtrinsic/visualization.html?dataset=Demo1&vr=1&load=0) for DK1 version or [here](http://creativecodinglab.github.io/BRAINtrinsic/visualization.html?dataset=Demo1&vr=2&load=0) for DK2 demo version. If you want to upload your own data, go to the upload page and
then select the version of Oculus Rift you are using in the radio button and finally click the "start" button.

#Matlab code
The Matlab toolbox can be downloaded [here](https://github.com/CreativeCodingLab/BRAINtrinsic/tree/master/Matlab%20toolbox).

#Color coding
BRAINtrinsic allows three different color coding schemas:
- Anatomy - nodes are grouped according to their neuroanatomical locations.
- Embeddedness - nodes that have been shown to be highly embedded in the human structural connectome [1] are highlighted.
- Rich-club - Rich-club nodes as defined in [2] are highlighted. Note that the Rich-club regions form a subset of highly-embedded nodes.

#Acknowledgment

The tool was entirely developed by Giorgio Conte who belongs to the [Creative Coding Research Group](https://www.evl.uic.edu/creativecoding/), directed by Prof.
Angus Forbes. The research group is part of the [Electronic Visualization Lab](https://www.evl.uic.edu) (EVL) at University of Illinois at Chicago (UIC).
This research is being done in collaboration with Dr. Alex Leow, Dr. Olusola Ajilore, and Dr. Allen Ye, all belonging to UIC Department of Psychiatry. BRAINtrinsic is an integral research component of the [CoNECt@UIC](http://conect.brain.uic.edu), an interdisciplinary team of researchers and clinicians devoted to improving the understanding of brain connectivity.

#References
**[1]** - Ye, A. Q., Zhan, L., Conrin, S., GadElKarim, J., Zhang, A., Yang, S., ... & Leow, A. (2015). Measuring embeddedness: Hierarchical scale‐dependent information exchange efficiency of the human brain connectome. Human Brain Mapping.

**[2]** - van den Heuvel, M. P., & Sporns, O. (2011). Rich-club organization of the human connectome. The Journal of neuroscience, 31(44), 15775-15786.
