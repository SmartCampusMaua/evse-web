"use client";

import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { format } from 'date-fns';

type MessagesState = {
  [key: string]: [number, Date];
};

export default function Home() {
  const [messages, setMessages] = useState<MessagesState>({});
  const [status, setStatus] = useState("");
  const broker = "ws://weblab.maua.br:9001";
  const options = {
    username: 'PUBLIC',
    password: 'public',
  };

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
      const jsonObject = JSON.parse(message.toString());
      if (jsonObject.data.type === "MeterValues") {
        const date = new Date(jsonObject.data.timestamp);

        setMessages(prevMessages => ({
          ...prevMessages,
          [jsonObject.data.deviceId]: [jsonObject.data.value, date]
        }));
      }
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <>
      <main className="p-8">
        <div className="relative">
          <h1 className="text-3xl font-bold mb-4">Carregadores de Veículo Elétrico EVSE</h1>
          <p className="background">{status}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {Object.keys(messages).length > 0 ? (
              Object.entries(messages).map(([connectorID, value]) => (
                <div key={connectorID} className="background bg-zinc-300 dark:bg-neutral-700 rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-semibold">Carregador {connectorID}</h2>
                  <div className="mt-2">
                    <p className="background">Meter Value: {value[0]} Wh</p>
                    <p className="background">{format(value[1], 'dd/MM - HH:mm:ss')}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="background">No messages</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
