import React, { Component } from 'react';
import { View, StatusBar} from 'react-native';
import BackgroundGame from "../components/BackgroundGame";
import Character from "../components/Character";
import EngineConstants from '../constants/EngineConstants';
import { MoveBlock, JumpBlock, GrabBlock } from '../scripts/blocks/ActionBlock';
import { Characters, Environments, Items } from '../constants/BlockType';
import { ForBlock, IfBlock, WhileBlock } from '../scripts/blocks/InstructionBlock';
import CharacterBlock from '../scripts/blocks/CharacterBlock';
import { DataBlock } from '../scripts/blocks/DataBlock';
import MapItem from '../components/MapItem'
import Inventory from '../components/Inventory';
import { ConditionBlock, StructureBlock } from '../scripts/blocks/MainBlocks';
import { IsInFrontBlock, IsOnBlock, PossessBlock } from '../scripts/blocks/ConditionBlock';
import Overlay from '../components/Overlay';
import { CameraMode } from '../constants/CameraMode';
import Cells from '../constants/Cells';
import { isItem } from '../constants/ItemImages';

interface IProps {
    navigation: any,
    route: any
}

interface IState {
    bg0Pos: number,
    bg1Pos: number,
    playerPosY: number,
    map: any,
    itemsPos: number[],
    hasLost: boolean,
    hasWon: boolean,
    inventory: any,
}

class Game extends Component<IProps, IState> {

    private moveDistance: number = 0;
    private characterPos: number = 0;
    private frameCount: number = 0;
    private rateTicks: number = 1000.0 / 60.0;
    private baseTicks: number = Date.now();
    private lastTicks: number = this.baseTicks;
    private timePassed: number = 0;
    private frameDelay: number = 0;
    private speed: number = EngineConstants.MAX_WIDTH * this.rateTicks * 0.0002;
    private actions: any;
    private endReason: string = "";
    private mounted: boolean = false;

    constructor(props: IProps) {
        super(props);
        this.state = {
            bg0Pos: 0,
            bg1Pos: EngineConstants.MAX_WIDTH,
            playerPosY: EngineConstants.MAX_HEIGHT * 0.15,
            map: [...props.route.params.mapInfo.map],
            itemsPos: props.route.params.mapInfo.map.map((item: any, index: number) => EngineConstants.CELL_SIZE * index),
            hasLost: false,
            hasWon: false,
            inventory: {},
        };

        if (props.route.params.cameraMode == CameraMode.TEST) {
            //this.actions = new CharacterBlock(new WhileBlock(new IsInFrontBlock(new DataBlock(Environments.Puddle)), new JumpBlock(null), null), Characters.Kevin);
            this.actions = new CharacterBlock(new MoveBlock(new GrabBlock(new StructureBlock(null))), Characters.Kevin);
        } else {
            this.actions = props.route.params.actions;
            console.log(this.actions);
        }
    }

    async componentDidMount() {
        this.mounted = true;

        await this.actions.execute(this);

        if (this.state.map[this.characterPos] != Cells.Win && !this.state.hasLost && !this.state.hasWon) {
            this.fireEndScreen("loose", "Perdu, tu n'as pas atteint la ligne d'arriv??e")
        }
    }

    async componentWillUnmount() {
        this.mounted = false;
        console.log("unMounted");
    }

    isMounted(): boolean {
        return this.mounted;
    }

    // function that check if user can jump or not
    async preCheckState() {
        return await new Promise<void>((resolve) => {
            switch (this.state.map[this.characterPos + 1]) {
                case Cells.Win:
                    this.fireEndScreen("won")
                    break;
                case Cells.Bush:
                    this.fireEndScreen("loose", "Tu ne peux pas sauter par dessus un buisson ! Utilise la machette pour le tuer")
                    break;
                default:
                    break;
            }
            resolve()
        }) 
    }

    // function that check user's win or loss
    async checkState() {
        return await new Promise<void>((resolve) => {
            switch (this.state.map[this.characterPos]) {
                case Cells.Win:
                    this.fireEndScreen("won")
                    break;
                case Cells.Puddle:
                    this.fireEndScreen("loose", "Perdu, fait attention aux flaques d'eau")
                    break;
                case Cells.Bush:
                    this.fireEndScreen("loose", "Perdu, utilise la machette quand tu es devant le buisson pour le couper")
                    break;
                default:
                    break;
            }
            resolve()
        }) 
    }

    // Fire the loose screen with a message
    fireEndScreen(looseOrWon: string, endReason: string = "Bravo, tu as r??ussi !") {
        if (looseOrWon === "loose") {
            this.endReason = endReason;
            this.setState({hasLost: true});
            this.loose();
        } else {
            this.endReason = endReason;
            this.setState({hasWon: true});
            this.win();
        }
        
    }

    // Getter of hasLost state
    getStateHasLost() {
        return this.state.hasLost;
    }

    // Getter of hasWon state
    getStateHasWon() {
        return this.state.hasWon;
    }

    // Frame handling
    setFramerateDelay() {   
        this.frameCount++;

        var currentTicks = Date.now();
        this.timePassed = currentTicks - this.lastTicks;
        this.lastTicks = currentTicks;
        var targetTicks = this.baseTicks + this.frameCount * this.rateTicks;

        if (currentTicks <= targetTicks) {
            this.frameDelay = targetTicks - currentTicks;
        } else {
            this.frameCount = 0;
            this.baseTicks = Date.now();
            this.frameDelay = 0;
        }

        this.speed = EngineConstants.MAX_WIDTH * this.timePassed * 0.0002;
    }

    // Method to move the character (used in ActionBlock.js)
    async move() {
        this.moveDistance = 0
        
        var self = this;

        return await new Promise<void>(resolve => {                
            movePos();

            function movePos() {
                self.setFramerateDelay();

                var newItemPos = self.moveItems();
                var newBgPos = self.moveBackground();

                self.moveDistance += self.speed;

                // Fix memory leak when quitting
                if (!self.mounted)
                    resolve();

                self.setState({
                    bg0Pos: newBgPos[0],
                    bg1Pos: newBgPos[1],
                    itemsPos: newItemPos,
                })

                if (self.moveDistance >= EngineConstants.CELL_SIZE) {
                    self.characterPos++;
                    resolve();
                }
                else {
                    setTimeout(movePos, self.frameDelay);
                }      
            }
        });
    }

    // General function to jump the character (used in ActionBlock.js)
    // num_cell is the number of cell the animation last
    async jump(numCells : number = 2) {
        this.moveDistance = 0;

        var self = this;

        return await new Promise<void>(resolve => {
            // Fix memory leak when quitting
            if (!self.mounted)
                resolve();

            jumpPos();

            function jumpPos() {
                self.setFramerateDelay();

                var newItemPos = self.moveItems();
                var newBgPos = self.moveBackground();
                var playerPosY = self.moveCharacUpDown();

                self.moveDistance += self.speed;

                // Fix memory leak when quitting
                if (!self.mounted)
                    resolve();

                self.setState({
                    bg0Pos: newBgPos[0],
                    bg1Pos: newBgPos[1],
                    itemsPos: newItemPos,
                    playerPosY: playerPosY,
                })

                if (self.moveDistance >= EngineConstants.CELL_SIZE * numCells) {
                    self.characterPos += numCells;
                    resolve();
                }
                else {
                    setTimeout(jumpPos, self.frameDelay);
                }      
            }
        });
    }

    grab() {
        var currCell = this.state.map[this.characterPos];

        if (currCell == Cells.Empty || !isItem(currCell.content.imageName)) {
            this.fireEndScreen("loose", "Perdu, fait attention de ramasser au bon moment !")
            console.log("grab failed");
            return false;
        }
            
        // Fix memory leak when quitting
        if (!this.mounted)
            return false;

        this.setState((prevState) => {
            let inventory = Object.assign({}, prevState.inventory);  
            inventory[currCell.content.imageName] = inventory[currCell.content.imageName] ? inventory[currCell.content.imageName] + 1 : 1;                                  
            let newMap = prevState.map;
            newMap[this.characterPos] = Cells.Empty
            return {...prevState, inventory, newMap };                                 
        });

        return true;
    }

    // Function for jump translation
    moveCharacUpDown = () => {
        if (this.moveDistance <= EngineConstants.CELL_SIZE) {
            let acc = 1 - this.moveDistance / EngineConstants.CELL_SIZE;
            return this.state.playerPosY + this.speed * 2 * acc;
        } else {
            let acc = this.moveDistance / EngineConstants.CELL_SIZE - 1;
            return this.state.playerPosY - this.speed * 2 * acc;
        }
    }

    // Function for move translation of the character
    moveBackground = () => {
        let newBg0Pos = this.state.bg0Pos - this.speed;
        if (newBg0Pos + EngineConstants.MAX_WIDTH < 0)
            newBg0Pos += EngineConstants.MAX_WIDTH * 2;

        let newBg1Pos = this.state.bg1Pos - this.speed;
        if (newBg1Pos + EngineConstants.MAX_WIDTH < 0)
            newBg1Pos += EngineConstants.MAX_WIDTH * 2;

        return [newBg0Pos, newBg1Pos];
    }

    // Function for move translation of all the items in the map
    moveItems = () => {
        let newItemPos: number[] = [];
        for (let item of this.state.itemsPos)
            newItemPos.push(item - this.speed);
        
        return newItemPos;
    }

    // Function to notify loose
    loose() {
        console.log('You lost');
    }

    // Function to notify win
    win() {
        console.log('You won');
    }

    // return true if character is in front of an entity(data block)
    isInFront(entity: string) {
        return this.state.map[this.characterPos + 1].content && this.state.map[this.characterPos + 1].content.imageName == entity;
    }

    // return true if character is on an entity(data block)
    isOn(entity: string) {
        return this.state.map[this.characterPos].content && this.state.map[this.characterPos].content.imageName == entity;
    }

    // return true if character possess an entity(data block)
    possess(entity: string) {
        return this.state.inventory[entity] != undefined;
    }

    backToSelectLevels = () : void => {
        this.props.navigation.pop();
        this.props.navigation.pop();
        this.props.navigation.pop();
    }

    backToLevelFailed = () : void => {
        this.props.navigation.pop();
        this.props.navigation.pop();
    }
    
    render() {
        let arr = this.state.map.map((item: any, index: number) => {
            if (item != Cells.Empty) {
                return <MapItem key={index} item={item} position={[this.state.itemsPos[index], EngineConstants.MAX_HEIGHT * 0.15 ]} />                            
            }
        });

        return (
            <View style={{width: EngineConstants.MAX_WIDTH, height: EngineConstants.MAX_HEIGHT}}>
                { this.state.hasWon && <Overlay cameraMode={this.props.route.params.cameraMode} hasWon={true} text={this.endReason} color="green" backToSelectLevels={this.backToSelectLevels} backToLevelFailed={this.backToLevelFailed}/> }
                { this.state.hasLost && <Overlay cameraMode={this.props.route.params.cameraMode} hasWon={false} text={this.endReason} color="red" backToSelectLevels={this.backToSelectLevels} backToLevelFailed={this.backToLevelFailed}/> }
                <BackgroundGame imgBackground={this.props.route.params.mapInfo.theme.background1} position={[this.state.bg0Pos, 0]} />
                <BackgroundGame imgBackground={this.props.route.params.mapInfo.theme.background2} position={[this.state.bg1Pos, 0]} />
                <Character position={[0, this.state.playerPosY]} character={this.actions.character} />
                { arr }
                <Inventory inventory={this.state.inventory} />
                <StatusBar translucent backgroundColor="transparent"/>
            </View>
        )
    }
}

export default Game;