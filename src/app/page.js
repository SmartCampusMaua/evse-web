"use client"

import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';

const Home = () => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState([]);
    const broker = "ws://weblab.maua.br:9001"
    const options = {
        username: 'PUBLIC',
        password: 'public',
    };
    useEffect(() => {
        const client = mqtt.connect(broker, options);

        client.on('connect', () => {
            client.subscribe('IMT/EVSE/#', (err) => {
                if (err) {
                    setStatus(`Erro na conexao :${broker} -->  ${err}`)
                }
                else{
                    setStatus(`Conectado ${broker}`)
                }
            });
        });

        client.on('message', (topic, message) => {
            const jsonObject = JSON.parse(message.toString());
            if (jsonObject.data.type == "MeterValues"){
                setMessages(jsonObject.data.value)
            }
        });

    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>MQTT Example {status}</h1>
            <div style={styles.messageContainer}>
            <h1 style={styles.message}>Meter Value: {messages}</h1>
            </div>
        </div>
    );
};
const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
    },
    header: {
        color: '#000',
    },
    messageContainer: {
        marginTop: '20px',
        width: '80%',
        maxWidth: '600px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        padding: '10px',
    },
    message: {
        padding: '10px',
        borderBottom: '1px solid #eee',
        color: '#000',
        
    },
    noMessages: {
        color: '#999',
        textAlign: 'center',
    },
};
export default Home;