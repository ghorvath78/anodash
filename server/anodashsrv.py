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
        packet["sample"] =  self.dataFrame.iloc[self.endPos-1,:].to_dict()
        packet["maximum"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].max().to_dict()
        packet["minimum"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].min().to_dict()
        packet["quantile10"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.10).to_dict()
        packet["quantile25"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.25).to_dict()
        packet["quantile50"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.50).to_dict()
        packet["quantile75"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.75).to_dict()
        packet["quantile90"] =  self.dataFrame.iloc[self.startPos:self.endPos,:].quantile(0.90).to_dict()
        packet["window"] =  self.W

        # update key time measurement
        self.sinceKeyTime += 1
        if self.sinceKeyTime >= self.W:
            self.sinceKeyTime = 0
            self.keyTimeUpdate()            
            packet["graph"] = {"nodes": [{"id": n} for n in self.mst.nodes()], "links": [{"source": pr[0], "target": pr[1]} for pr in self.mst.edges()]}

        if self.sinceKeyTime == 1:
            self.mst = nx.maximum_spanning_tree(nx.from_pandas_adjacency(self.dataFrame.iloc[:self.W,:].corr(method="kendall").abs()))
            packet["graph"] = {"nodes": [{"id": n} for n in self.mst.nodes()], "links": [{"source": pr[0], "target": pr[1]} for pr in self.mst.edges()]}

        return packet

    def keyTimeUpdate(self):
        kmtrx = self.dataFrame.iloc[self.startPos:self.endPos,:].corr(method="kendall").abs()
        G_kendall = nx.from_pandas_adjacency(kmtrx)
        self.mst = nx.maximum_spanning_tree(G_kendall)

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

dataSet = DataSet(dta, "basestation", "szupertitkos adatset", 200)

print("starting server")
server = websockets.serve(srvmain, "localhost", 8880)

asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()
print("exiting server")