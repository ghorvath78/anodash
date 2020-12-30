import numpy as np
import pandas as pd
import asyncio
import websockets
import json
import networkx as nx
import scipy

task = None
dta = pd.read_csv("./dataset/realdta1e4.csv")

class DataSet:
    def __init__(self, df, name, descr, W):
        self.dataFrame = df
        self.name = name
        self.descr = descr
        self.W = W
        self.buffer = None
        
    def initialize(self, start):
        self.startPos = start
        self.endPos = start
        self.sinceKeyTime = 0;

    def nextStep(self):

        self.endPos += 1
        if self.endPos - self.startPos > self.W:
            self.startPos = self.endPos - self.W
        
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


        # update key time measurement
        self.sinceKeyTime += 1
        if self.sinceKeyTime >= self.W:
            self.sinceKeyTime = 0
            self.mst = self.recalcRelations(self.startPos, self.endPos)            

        if not hasattr(self, 'mst'):
            self.mst = self.recalcRelations(self.startPos, self.startPos+self.W);

        packet["relations"] = [{"var1": pr[0], "var2": pr[1], "score": np.random.rand()} for pr in self.mst.edges()]

        return packet

    def recalcRelations(self, startPos, endPos):
        kmtrx = self.dataFrame.iloc[startPos:endPos,:].corr(method="kendall").abs()
        kmtrx[np.isnan(kmtrx)] = 0;
        G_kendall = nx.from_pandas_adjacency(kmtrx)
        return nx.maximum_spanning_tree(G_kendall)

async def dataFeeder(websocket, message):
    for i in range(1000):
        print("sending message ", i)
        await websocket.send(json.dumps(dataSet.nextStep()))
        await asyncio.sleep(float(message["sampleDelay"]));


async def srvmain(websocket, path):
    global task
    msg = json.loads(await websocket.recv())
    print("server message: ", msg)
    if msg["command"] == "playDataSet":
        if task:
            task.cancel()
        dataSet.initialize(0)
        task = asyncio.create_task(dataFeeder(websocket, msg))
        await task

dataSet = DataSet(dta, "basestation", "szupertitkos adatset", 100)

print("starting server")
server = websockets.serve(srvmain, "localhost", 8880)

asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()
print("exiting server")