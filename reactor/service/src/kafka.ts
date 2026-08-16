import { Kafka, logLevel, type Consumer, type Producer } from "kafkajs";

export const JOBS_TOPIC = "reactor.jobs";

export function createKafka(brokers: string[]) {
  return new Kafka({
    clientId: "llb-reactor",
    brokers,
    logLevel: logLevel.ERROR,
    retry: { retries: 8 },
  });
}

export async function createProducer(kafka: Kafka): Promise<Producer> {
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

export async function createConsumer(kafka: Kafka): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId: "llb-reactor-workers" });
  await consumer.connect();
  await consumer.subscribe({ topic: JOBS_TOPIC, fromBeginning: false });
  return consumer;
}

export async function publishJobId(producer: Producer, id: string) {
  await producer.send({
    topic: JOBS_TOPIC,
    messages: [{ key: id, value: JSON.stringify({ id }) }],
  });
}
