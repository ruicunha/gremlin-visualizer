import { COMMON_GREMLIN_STEPS} from '../../constants';

export default class SuggestionManager {
    suggestions;
    suggestion;
    currentIndex;
    
    constructor() {
        this.suggestions = [];
        this.suggestion = "";
        this.currentIndex = 0;
    }

    reset() {
        this.suggestions = [];
        this.suggestion = "";
        this.currentIndex = 0;
    }

    hasSuggestion() {
        return this.suggestion.length > 0
    }

    hasAny() {
        return this.suggestions.length > 0
    }

    cycleUp(buffer) {
        this.currentIndex++;
        return this.cycleSuggestion(buffer);
    }

    isValidUpCycle() {
        return this.suggestions.length > 1 && this.currentIndex < this.suggestions.length - 1;
    }

    cycleDown(buffer) {
        this.currentIndex--;
        return this.cycleSuggestion(buffer);
    }

    isValidDownCycle() {
        return this.suggestions.length > 1 && this.currentIndex >  0;
    }

    cycleSuggestion(buffer) {
        try {
          const inputStep = buffer.slice(buffer.lastIndexOf('.')).replace('.', '');        
          if(inputStep)
          {
            this.suggestion = this.suggestions[this.currentIndex].slice(inputStep.length);
            return `\x1b[92m${this.suggestion}\x1b[97m`;
          }
          return ""
        } catch (error) {
          console.log(error)
          return ""
        } 
      }

    getSuggestion(char, buffer) {
        try {
            if((/[a-zA-Z]/).test(char)){
            const inputStep = buffer.slice(buffer.lastIndexOf('.')).replace('.', '');        
            if(inputStep)
            {
                this.suggestions = COMMON_GREMLIN_STEPS.filter((step) => step.startsWith(inputStep));
                this.currentIndex = 0;
                this.suggestion = this.hasAny() ? this.suggestions[0].slice(inputStep.length) : "";
                return `\x1b[92m${this.suggestion}\x1b[97m`;
            }
            }
            return ""
        } catch (error) {
            console.log(error)
            return ""
        } 
    }
}