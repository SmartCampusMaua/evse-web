"use client";

import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';

class Charger {
  name: string;
  power: number;
  status: boolean;
  total: number;
  start: Date;
  finish: Date;
  buffer: number;

  constructor(name: string, power: number, status: boolean = false, total: number = 0, start: Date, finish: Date, buffer: number = 10) {
    this.name = name;
    this.power = power;
    this.status = status;
    this.total = total;
    this.start = start;
    this.finish = finish;
    this.buffer = buffer;
  }
}
const connectors: Record<string, string> = {
  "erro": "Outros Carregadores",
  "19400577": "Carregador Lanchonete",
  "19743013": "Carregador Bloco B",
  "Simulador-1": "Simulador",
};
export default function Home() {
  //configuring MQTT and state variables
  const [chargers, setChargers] = useState<Charger[]>([]);
  // const [chargers, setChargers] = useState<Record<string, Charger>>({});

  const [status, setStatus] = useState("");
  const broker = "wss://mqtt.maua.br:8084";
  const options = {
    username: 'PUBLIC',
    password: 'public',
  };
  //  connecting with the Broker
  useEffect(() => {
    const client = mqtt.connect(broker, options);

    client.on('connect', () => {
      client.subscribe('IMT/EVSE/#', (err) => {
        if (err) {
          setStatus(`Erro na conexão: ${broker} --> ${err}`);
        } else {
          setStatus(`Conectado ${broker}`);
        }
      });
    });

    client.on('message', (topic, message) => {
      // console.log(topic,message.toString)
      console.log(message.toString)
      const jsonObject = JSON.parse(message.toString());
      console.log(jsonObject)
      console.log(jsonObject.data.deviceId)

      if ( connectors.hasOwnProperty(jsonObject.data.deviceId) ){
        jsonObject.data.name = connectors[jsonObject.data.deviceId]
        console.log("__________________")
        console.log(jsonObject.data.deviceId)
        console.log("_________NOME_________")
        console.log(jsonObject.data.name)
    }

      if (jsonObject.data.type === "MeterValues" && jsonObject.data.deviceId !== "EVSE_1") {
      
        setChargers(prevChargers => {

          const chargerIndex = prevChargers.findIndex(item => item.name === jsonObject.data.name);
          const powerValue = jsonObject.data.value;
          const timestamp = new Date(jsonObject.data.timestamp);

          if (chargerIndex === -1) {
            const newCharger = new Charger(jsonObject.data.name, powerValue, false, 0, timestamp, timestamp);
            return [...prevChargers, newCharger];
          } else {
            return prevChargers.map((charger, index) => {
              if (index === chargerIndex) {
                const newCharged = powerValue - charger.power;
                let newStatus = false;
                let newStart = charger.start;
                if (newCharged > 0) {
                  newStatus = true;
                  charger.buffer = 0;
                } else if (charger.buffer <= 10 && newCharged == 0) {
                  newStatus = true;
                  charger.buffer += 1;
                }
                if (!newStatus) {
                  newStart = timestamp
                }

                return new Charger(charger.name, powerValue, newStatus, charger.total + newCharged, newStart, timestamp, charger.buffer);
              }
              return charger;
            });
          }
        });
      }
      // console.log("CHARGES")
      // console.log(chargers)
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <>
      <main className="p-0 overscroll-none">
        <div className="relative min-h-screen">
          <div className="absolute inset-0 bg-[url('/battery.png')] dark:bg-[url('/batteryW.png')] bg-no-repeat bg-center bg-contain" style={{ opacity: '0.05' }}></div>
          <div className="flex flex-col items-start justify-start h-full relative z-10 p-4">
            <h1 className="text-3xl font-bold mb-4">Carregadores de Veículo Elétrico EVSE</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full">
              {chargers.length > 0 ? (
                chargers.map((charger, index) => (
                  <div key={index} className="background bg-zinc-300 dark:bg-neutral-700 rounded-lg shadow-md p-4 w-full sm:w-[90%] mx-auto border-2 border-slate-800 dark:border-slate-300">
                    <h2 className="text-xl font-semibold text-center">Carregador {charger.name}</h2>
                    <div className="mt-2 text-center text-xl">
                      <div className="background flex items-center">
                        <span>{charger.status ? "Carregando" : "Carregamento Concluído"}</span>
                        <span>: {Math.round(charger.total)} Wh</span>
                      </div>
                      <p className="background flex">Tempo de carregamento: {Math.floor((charger.finish.getTime() - charger.start.getTime()) / 1000 / 60)} min</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="background">No messages</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
