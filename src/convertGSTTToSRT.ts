export function convertGSTTToSRT(string: string, options: { MAX_WORDS_COUNT_IN_1_LINE: number } = { MAX_WORDS_COUNT_IN_1_LINE: 10 }) {
    const MAX_WORDS_COUNT_IN_1_LINE = options.MAX_WORDS_COUNT_IN_1_LINE || 10;

    class hourRepresentation {
        private hours: number;
        private minutes: number;
        private seconds: number;
        private nanos: string; // nanoSeconds are beter as string since we do not opperate with them,
        constructor(input: string | speechV2TimeRepresentation) {
            let seconds, nanos: string;
            if (determineIfv2(input)) {
                seconds = input.seconds || '0';
                this.nanos = input.nanos ? String(input.nanos) : '000';
            } else {
                seconds = input.substring(0, input.length - 1);
                this.nanos = '000'; // servide doesn't return nanoseconds on v1
            }
            this.seconds = +seconds;
            this.hours = Math.floor(this.seconds / 3600);
            this.minutes = Math.floor(this.seconds % 3600 / 60);
            this.seconds = Math.floor(this.seconds % 3600 % 60);
        }

        toString() {
            return String(this.hours).padStart(2, '0') + ':'
                + String(this.minutes).padStart(2, '0') + ':'
                + String(this.seconds).padStart(2, '0') + ','
                + this.nanos.substr(0,3);
        }

    }

    type speechV2TimeRepresentation = {
        seconds: string;
        nanos?: string;
    }

    function determineIfv2(toBeDetermined: string | speechV2TimeRepresentation): toBeDetermined is speechV2TimeRepresentation {
        return typeof toBeDetermined === 'object';
    }

    function chunkArray (array: any, size: number) {
        var i, j, arrays = [];
        for (i = 0, j = array.length; i < j; i += size) {
            arrays.push(array.slice(i, i + size));
        }
        return arrays;
    }

    function chunkLine (line: any) {
        var chunks = chunkArray(line.alternatives[0].words, MAX_WORDS_COUNT_IN_1_LINE);
        var lines = [];

        for (i = 0; i < chunks.length; i += 1) {
            var words = chunks[i];
            lines.push({
                alternatives: [{ words: words, transcript: words.map(function (word: any) { return word.word; }).join(' ') }]
            });
        }
        return lines;
    }

    var obj = JSON.parse(string);
    var i = 1;
    var result = '';
    const array = obj.response ? obj.response.results : obj.results; // The object can be the full response or the response object

    function processLine (line: any) {
        result += i++;
        result += '\n';
        var word = line.alternatives[0].words[0];
        var time = new hourRepresentation(word.startTime);
        result += time.toString() + ' --> ';
        var word = line.alternatives[0].words[line.alternatives[0].words.length - 1];
        time = new hourRepresentation(word.endTime);
        result += time.toString() + '\n';
        result += line.alternatives[0].transcript + '\n\n';
    }

    for (const line of array) {
        if (line.alternatives[0].words.length <= MAX_WORDS_COUNT_IN_1_LINE) {
            processLine(line)
        } else {
            chunkLine(line).forEach(processLine);
        }
    }

    return result;
}

