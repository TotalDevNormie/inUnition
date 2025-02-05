import moment from "moment";

//returns the index of the newest timestam
const newestTimestamp = (timestamps: string[]) => 
    timestamps.reduce((acc, timestamp) => {
        const timestampMoment = moment(timestamp);
        if (acc === -1 || timestampMoment.isAfter(moment(timestamps[acc]))) {
            return timestamps.indexOf(timestamp);
        }
        return acc;
    }, -1);

export default newestTimestamp;