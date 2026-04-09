import { useEffect, useState, useCallback, useRef } from 'react';
import * as ROSLIB from 'roslib';
import { useSimulationStore } from '@/stores/simulationStore';

export const useROS = (url: string = 'ws://207.126.167.78:9090') => {
  const [ros, setRos] = useState<ROSLIB.Ros | null>(null);
  const [connected, setConnected] = useState(false);
  const log = useSimulationStore((state) => state.log);
  const updateComponentProperty = useSimulationStore((state) => state.updateComponentProperty);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    console.log(`Attempting to connect to ROS at ${url}...`);
    const rosInstance = new ROSLIB.Ros({
      url: url
    });

    rosInstance.on('connection', () => {
      setConnected(true);
      setRos(rosInstance);
      log('success', 'Connected to ROS 2 Bridge');
      console.log('ROS Connected');
      
      const cmdVelTopic = new ROSLIB.Topic({
        ros: rosInstance,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/msg/Twist'
      });

      cmdVelTopic.subscribe((message: any) => {
        const components = useSimulationStore.getState().components;
        const robot = components.find(c => c.category === 'robot');
        if (robot) {
          updateComponentProperty(robot.id, 'linear_vel', message.linear.x);
          updateComponentProperty(robot.id, 'angular_vel', message.angular.z);
        }
      });
    });

    rosInstance.on('error', (error) => {
      setConnected(false);
      console.error('ROS Error:', error);
      // Don't log to UI console repeatedly to avoid clutter
    });

    rosInstance.on('close', () => {
      setConnected(false);
      setRos(null);
      console.log('ROS Connection Closed. Retrying in 5s...');
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    });

  }, [url, log, updateComponentProperty]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // We don't explicitly close here to let the 'close' handler manage state
    };
  }, [connect]);

  const subscribeToTopic = useCallback((name: string, messageType: string, callback: (message: any) => void) => {
    if (!ros || !connected) return;
    const topic = new ROSLIB.Topic({
      ros: ros,
      name: name,
      messageType: messageType
    });
    topic.subscribe(callback);
    return () => topic.unsubscribe();
  }, [ros, connected]);

  const publishToTopic = useCallback((name: string, messageType: string, message: any) => {
    if (!ros || !connected) return;
    const topic = new ROSLIB.Topic({
      ros: ros,
      name: name,
      messageType: messageType
    });
    topic.publish(message);
  }, [ros, connected]);

  return { ros, connected, subscribeToTopic, publishToTopic };
};
