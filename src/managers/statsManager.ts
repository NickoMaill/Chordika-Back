import DateTime from '~/core/class/DateTime';
import { TrackingQuery, VisitTracking } from '~/models/stats';
import trackingModule from '~/module/services/tracking/trackingModule';

class StatsManager {
    // public --> start region /////////////////////////////////////////////
    public async getVisitTracking(query: Record<string, string>): Promise<VisitTracking> {
        const q: TrackingQuery = {
            startDate: new DateTime(query.startDate),
            endDate: new DateTime(query.endDate),
            metrics: query.metrics.split(','),
            dimensions: query.dimensions ? query.dimensions.split(',') : ['month', 'country'],
        };
        const res = await trackingModule.getAnalyticsData(q);
        if (!res.data.rows) res.data.rows = [];
        return res.data as VisitTracking;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new StatsManager();
