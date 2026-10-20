import mongoose, {Schema} from "mongoose";
import { ExploreRoutes, RouteStop, RouteVisibility, RoutesStatus } from "../Utils/DataChecking";
import { HydratedDocument } from "mongoose";

const routeStopSchema = new Schema<RouteStop>({
    station: {
        type: Schema.Types.ObjectId,
        ref: "Station",
        required: true,
    }, 
    sequence: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger, 
            message: "Sequence must be an integer",
        } 
    },

    distanceFromOriginKm: {
        type: Number,
        required: true,
        min: 100
    },
},
    {
        _id: false,
    }
);

const explore_routes_Schema = new mongoose.Schema<ExploreRoutes>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100
        },
        
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: 30,
        },
        
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 120,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 2000,
        },

        shortDescription: {
            type: String,
            trim: true,
            maxlength: 200,
        },

        originStation: {
            type: Schema.Types.ObjectId,
            ref: "Station",
            required: true,
        },

        stops: {
            type: [routeStopSchema],
            default: [],
            validate: {
                validator: function(stops: RouteStop[]) {
                    const sequences = stops.map((stop) => stop.sequence);

                    return (new Set(sequences).size === sequences.length) // Set(sequences) make sure duplicate are remove and return the new value and it size. 
                    // so if for any reason there are duplicates then the sequence.length won't match the size anymore. which resolve to validation failure
                }, 
                message: "Stop sequence numbers must be unique.",
            },
        },

        distanceKm: {
            type: Number,
            required: true,
            min: 0.1,
            validate: {
                validator: Number.isFinite,
                message: "Distance must be a finite number.",
            },
        },

        estimatedDurationMinutes: {
            type: Number,
            required: true,
            min: 1, 
            validate: {
                validator: Number.isInteger,
                message: "Duration must be a whole number",
            },
        },

        scenicHighlights: {
            type: [String],
            default: [],
            validate: {
                validator: (items: string[]) => items.length <= 20 && items.every((item) => item.trim().length > 0 && item.length <= 100),
                message: "Invalid scenic highlights.",
            },
        },

        status: {
            type: String,
            enum: ["Active", "InActive", "Under Maintenance", "Closed"] satisfies RoutesStatus[],
            default: "Active",
            required: true,
        },

        visibility: {
            type: String,
            enum: ["Draft", "Published", "Archived"] satisfies RouteVisibility[],
            default: "Draft",
            required: true,
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// All validators will be backed on the frontend as well. so no middleware for explore routes now until we see the need for one. 

export type RouteDocument = HydratedDocument<ExploreRoutes> // HydratedDocument<ExploreRoutes> tells typescript that an object is a live, full-fledged Mongoose document
// so some mongoose method will be available e.g .save(), .toObject() or getters/virtuals.

const Explore_Routes = mongoose.model<ExploreRoutes>("Explore_Routes", explore_routes_Schema);

export default Explore_Routes;