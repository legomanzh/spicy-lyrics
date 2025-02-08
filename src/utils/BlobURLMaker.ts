export default async function BlobURLMaker(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error fetching and converting to blob URL:", error);
        throw error;
    }
}