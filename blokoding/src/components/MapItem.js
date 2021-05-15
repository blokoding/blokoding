import React, {Component} from 'react'
import {View, Text, StyleSheet, Image } from 'react-native'
import AutoHeightImage from 'react-native-auto-height-image';
import MapItems, { Environments } from '../constants/BlockType';
import EngineConstants from '../constants/EngineConstants';
import { EnvironmentImages, getEnvironmentUri } from '../constants/EnvironmentImages';


export default class MapItem extends Component {

    constructor(props) {
        super(props);
        this.state = {
            imageSource: props.item.content.uri
        }
        this.isEnv = Object.entries(Environments).filter(env => this.props.item.content.imageName == env[1])[0] != null;
    }

    render() {
        const x = this.props.position[0];
        const y = this.props.position[1];

        return (
            <View style={[styles.container, {bottom: y, left: x}]}>
                <AutoHeightImage source={this.state.imageSource} width={ this.isEnv ? EngineConstants.CELL_SIZE : EngineConstants.CELL_SIZE / 2} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        zIndex: 1,
    }
})
