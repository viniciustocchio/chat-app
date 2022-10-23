import React from 'react';
import { View, Text, Button, TextInput, StyleSheet, Platform, KeyboardAvoidingView  } from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const firebase = require('firebase');
require('firebase/firestore');

export default class Chat extends React.Component {
  constructor () {
    super();
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: '',
        avatar: '',
        name: '',
      },
      isConnected: false,
      image: null,
      location: null
    };

    const firebaseConfig = {
      apiKey: "AIzaSyA5e39KR8PG8wZIb_6KpdSE1gsWkOEgHH0",
      authDomain: "chatapp-452f8.firebaseapp.com",
      projectId: "chatapp-452f8",
      storageBucket: "chatapp-452f8.appspot.com",
      messagingSenderId: "510081051247",
      appId: "1:510081051247:web:2a5f555d43d994c99b3b9a"
    };

    if (!firebase.apps.length){
      firebase.initializeApp(firebaseConfig);
    }

    this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text || '',
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar || ''
        },
        image: Date.image || null,
        location: data.location || null,
      });
    });  
    this.setState({
      messages,
    });
  };

  async getMessages() {
    let messages = '';
    try {
        messages = await AsyncStorage.getItem('messages') || [];
        this.setState({
            messages: JSON.parse(messages)
        });
    } catch (error) {
        console.log(error.message);
    }
  };

  async saveMessages() {
      try {
          await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
      } catch (error) {
          console.log(error.message);
      }
  }

  async deleteMessages() {
      try {
          await AsyncStorage.removeItem('messages');
      } catch (error) {
          console.log(error.message);
      }
  }

  componentDidMount() {
    let { name } = this.props.route.params;
    this.props.navigation.setOptions({ title: name });

    NetInfo.fetch().then(connection => {
      if (connection.isConnected) {
        this.setState({
          isConnected: true,
        });
        console.log('online');

        this.referenceChatMessages = firebase.firestore().collection('messages');

        this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
          if (!user) {
              firebase.auth().signInAnonymously();
          }
          this.setState({
            uid: user.uid,
            messages: [],
            user: {
                _id: user.uid,
                name: name,
            },
          });
          this.unsubscribe = this.referenceChatMessages
            .orderBy('createdAt', 'desc')
            .onSnapshot(this.onCollectionUpdate);
          this.saveMessages();
        });
      } else {
          this.setState({
              isConnected: false,
          });
          console.log('offline');
          this.getMessages();
        }
  })
}
 
  componentWillUnmount() {
    if (this.isConnected) {
        this.unsubscribe();
        this.authUnsubscribe();
    }
  }

  addMessages = () => {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
        uid: this.state.uid,
        _id: message._id,
        text: message.text || '',
        createdAt: message.createdAt,
        user: message.user,
        image: message.image || null,
        location: message.location || null,
    });
  }

  onSend(messages = []) {
      this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, messages),
      }), () => {
          this.saveMessages();
          this.addMessages(this.state.messages[0]);
          this.deleteMessages();
      });
  }

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: 'orange'
          }
        }}
      />
    )
  }

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
        return (
            <InputToolbar
                {...props}
            />
        );
    }
  }

  render() {
    const { color, name } = this.props.route.params;
    return (
      <View style={[{ backgroundColor: color }, styles.container]}>
        <GiftedChat
            renderBubble={this.renderBubble.bind(this)}
            renderInputToolbar={this.renderInputToolbar.bind(this)}
            messages={this.state.messages}
            isConnected={this.state.isConnected}
            onSend={messages => this.onSend(messages)}
            user={{
                _id: this.state.user._id,
                name: name,
            }}
            renderActions={this.renderCustomActions}
            renderCustomView={this.renderCustomView}
        />
        {/*Fixing Android keyboard*/}
        {Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatTitle: {
    color: '#ffffff'
  },
})