module.exports = class PomfyClient {
    constructor() {
        this.baseUrl = 'https://api.pomfy.stream';
    }

    async filme(id){
        const url = `${this.baseUrl}/filme/${id}`;
        try {
            return [
                {
                    server: 'Pomfy',
                    url
                }
            ];
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}