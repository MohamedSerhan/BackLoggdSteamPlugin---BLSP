//Copyright 2023 Qewertyy, MIT License

function extractGame(element: any) {
    const game = element.find("div.overflow-wrapper");
    const name = game.find("img").attr("alt");
    const image = game.find("img").attr("src");
    if (name && image) {
        return { name, image };
    }
    return null;
}

export { extractGame}