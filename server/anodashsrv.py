import numpy as np
import pandas as pd
import asyncio
import websockets
import json
import networkx as nx
import math
import oleif

class DataFeeder:

    def __init__(self, df, name, descr, trees, samplesPerTree, window):
        self.dataFrame = df
        self.name = name
        self.descr = descr
        self.W = window
        self.samples = samplesPerTree
        self.trees = trees
        self.F = window / trees
        self.R = math.ceil(samplesPerTree / self.F) * self.F # this is the lenght of the window where the iforest samples are taken from
        self.buffer = None
        self.oleif = {}
        self.observed = ("", "")
        
    def initialize(self, start):
        self.startPos = start
        self.endPos = start
        self.windowOffset = 0;
        self.windowCounter = 0;
        self.windowUpdate(self.startPos, self.startPos+self.W);

    def nextStep(self):

        self.endPos += 1
        if self.endPos - self.startPos > self.W:
            self.startPos = self.endPos - self.W
        
        # update key time measurement
        self.windowOffset += 1
        if self.windowOffset >= self.W:
            self.windowOffset = 0
            self.windowCounter += 1
            self.windowUpdate(self.startPos, self.endPos)

        if self.windowCounter > 0 and self.windowOffset > 0 and self.windowOffset % self.F == 0:
            self.treeUpdate(self.startPos, self.endPos)

        # assemble data packet
        packet = {}
        packet["command"] = "putSample"
        packet["window"] =  self.W
        vardf = pd.DataFrame(data={ \
            "name": self.dataFrame.columns, \
            "value": self.dataFrame.iloc[self.endPos-1,:], \
            "score": np.random.rand(len(self.dataFrame.columns)), \
            "maximum": self.dataFrame.iloc[self.startPos:self.endPos,:].max(), \
            "minimum": self.dataFrame.iloc[self.startPos:self.endPos,:].min(), \
            "percentile05": self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.05), \
            "percentile25": self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.25), \
            "percentile50": self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.50), \
            "percentile75": self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.75), \
            "percentile95": self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.95) \
            })
        packet["variables"] = list(vardf.transpose().to_dict().values())
        packet["relations"] = [{"var1": pr[0], "var2": pr[1], "score": self.oleif[pr].compute_paths(self.dataFrame.iloc[self.endPos-1:self.endPos,:][list(pr)].to_numpy())[0] if self.dataFrame.iloc[self.endPos-1:self.endPos,:][list(pr)].isna().any(axis=None)==False else np.nan} for pr in self.mst.edges()]

        return packet

    def windowUpdate(self, startPos, endPos):
        # update relation graph
        kmtrx = self.dataFrame.iloc[startPos:endPos,:].corr(method="kendall").abs()
        kmtrx[np.isnan(kmtrx)] = 0;
        G_kendall = nx.from_pandas_adjacency(kmtrx)
        self.mst = nx.maximum_spanning_tree(G_kendall)
        # delete iforests that are not present in the new mst
        for v1, v2 in list(self.oleif.keys()):
            if (v1, v2) not in self.mst.edges() and (v2, v1) not in self.mst.edges() and (v1, v2) != self.observed and (v2, v1) != self.observed:
                del self.oleif[v1, v2]
        # add new iforests for newly appearing relations
        for v1, v2 in self.mst.edges():
            if (v1, v2) not in self.oleif.keys() and (v2, v1) not in self.oleif.keys():
                frst = oleif.iForest(self.trees, self.samples, self.samples, 0)
                X = self.dataFrame.iloc[startPos:endPos,:].loc[:,[v1,v2]].dropna()
                for i in range(self.trees):
                    if X.shape[0] >= self.samples:
                        frst.addNextTree(X.sample(self.samples, replace=False).to_numpy())
                    else:
                        frst.addNextTree(X.sample(self.samples, replace=True).to_numpy())
                self.oleif[(v1, v2)] = frst
            if (v1, v2) not in self.oleif.keys() and (v2, v1) in self.oleif.keys():
                self.oleif[(v1, v2)] = self.oleif.pop((v2, v1))

    def treeUpdate(self, startPos, endPos):
        for pr, frst in oleif.items():
            X = self.dataFrame.loc[endPos-self.R:endPos,:].loc[:,pr].dropna()
            if X.shape[0] >= self.samples:
                frst.addNextTree(X.sample(self.samples, replace=False).to_numpy())
            else:
                frst.addNextTree(X.sample(self.samples, replace=True).to_numpy())


async def triggerDataFeeder(websocket, message):
    for i in range(1000):
        print("sending message ", i)
        await websocket.send(json.dumps(dataFeeder.nextStep()))
        await asyncio.sleep(float(message["sampleDelay"]));

async def srvmain(websocket, path):
    global task
    msg = json.loads(await websocket.recv())
    print("server message: ", msg)
    if msg["command"] == "playDataSet":
        if task:
            task.cancel()
        dataFeeder.initialize(0)
        task = asyncio.create_task(triggerDataFeeder(websocket, msg))
        await task
    if msg["command"] == "observe" and task:
        task.setObservedRelation(msg["var1"], msg["var2"])
        
task = None
dta = pd.read_csv("./dataset/realdta1e4.csv")
dataFeeder = DataFeeder(dta, "basestation", "szupertitkos adatset", trees=64, samplesPerTree=256, window=2048)

print("starting server")
server = websockets.serve(srvmain, "localhost", 8880)
asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()
print("exiting server")