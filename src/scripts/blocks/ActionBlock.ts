import { StructureBlock } from "./MainBlocks";

class MoveBlock extends StructureBlock {
    constructor(nextBlock: MoveBlock | JumpBlock | GrabBlock | SpeakBlock | null) {
        super(nextBlock);
    }

    async execute(engine: any) {
        console.log("move");
        await engine.move();
        await engine.checkState();

        if (!engine.getStateHasLost() && !engine.getStateHasWon() && this.nextBlock) {
            await this.nextBlock.execute(engine);
        }
    }
}

class JumpBlock extends StructureBlock {
    constructor(nextBlock: MoveBlock | JumpBlock | GrabBlock | SpeakBlock | null) {
        super(nextBlock);
    }

    async execute(engine: any) {
        console.log("jump");
        await engine.jump();
        await engine.checkState();

        if (!engine.getStateHasLost() && !engine.getStateHasWon() && this.nextBlock) {
            await this.nextBlock.execute(engine);
        }
    }
}

class GrabBlock extends StructureBlock {
    constructor(nextBlock: MoveBlock | JumpBlock | GrabBlock | SpeakBlock | null) {
        super(nextBlock);
    }

    async execute(engine: any) {
        console.log("grab");

        if (engine.grab()) // If grab success
        {
            if (this.nextBlock) {
                await this.nextBlock.execute(engine);
            }
        }
    }
}

class SpeakBlock extends StructureBlock {
    constructor(nextBlock: MoveBlock | JumpBlock | GrabBlock | SpeakBlock | null) {
        super(nextBlock);
    }

    execute() {
        console.log("speak");
        if (this.nextBlock) {
            this.nextBlock.execute();
        }
    }
}

export { MoveBlock, JumpBlock, GrabBlock, SpeakBlock };
