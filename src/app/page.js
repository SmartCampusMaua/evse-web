"use client";

import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { format } from 'date-fns'; 

const Home = () => {
    const [messages, setMessages] = useState({});
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
                    [jsonObject.data.deviceId]: [jsonObject.data.value,date]
                }));
            }

        });

        return () => {
            client.end();
        };
    }, []);

    const messageArray = Object.entries(messages).map(([topic, value]) => ({ topic, value }));

    return (
        <div className="container">
            <h1 className="header">Carregadores de Veiculo Eletrico EVSE</h1>
            <p>{status}</p>
            <div className="gridContainer">
                {Object.keys(messages).length > 0 ? (
                    Object.entries(messages).map(([connectorID, value]) => (
                        <div key={connectorID} className="messageContainer">
                            <h2 className="messageHeader">Carregador {connectorID}</h2>
                            <div className='content'>
                                <p className="messageContent">Meter Value: {value[0]}</p>
                                <p className="messageContent">{format(value[1], 'HH:mm:ss - dd/MM')}</p>
                                {/* <p className="messageContent">{value[1].toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p> */}
                            </div>
                        </div>
                    ))
                ) : (

                    <p className="noMessages">No messages</p>
                )}
            </div>
        </div>
    );
};


export default Home;
