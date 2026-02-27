import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';

const PROTOCOL_SERVER = 'http://localhost:8345';

const ProtocolScreen = () => {
    const [protocolData, setProtocolData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadProtocolData();
    }, []);

    const loadProtocolData = async () => {
        try {
            const [infoRes, summaryRes] = await Promise.all([
                fetch(`${PROTOCOL_SERVER}/protocol/info`),
                fetch(`${PROTOCOL_SERVER}/protocol/summary`)
            ]);
            
            const info = await infoRes.json();
            const summ = await summaryRes.json();
            
            setProtocolData(info);
            setSummary(summ);
        } catch (error) {
            console.error('Failed to load protocol data', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProtocolData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>🌍 ABR Immutable Protocol</Text>
                <Text style={styles.subtitle}>The Algorithmic Reserve</Text>
            </View>

            <View style={styles.hashContainer}>
                <Text style={styles.hashLabel}>Genesis Hash:</Text>
                <Text style={styles.hashValue}>{protocolData?.protocol_hash}</Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Supply</Text>
                    <Text style={styles.statValue}>{protocolData?.total_supply?.toLocaleString()} ABR</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Genesis Supply</Text>
                    <Text style={styles.statValue}>{protocolData?.genesis_supply?.toLocaleString()} ABR</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Min Reserve</Text>
                    <Text style={styles.statValue}>{protocolData?.min_reserve_ratio}%</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Addresses</Text>
                    <Text style={styles.statValue}>{summary?.total_addresses}</Text>
                </View>
            </View>

            <View style={styles.immutabilityCard}>
                <Text style={styles.immutabilityText}>✅ Protocol is FOREVER IMMUTABLE</Text>
                <Text style={styles.immutabilitySubtext}>Parameters unchanged since genesis</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 5,
    },
    hashContainer: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    hashLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    hashValue: {
        fontSize: 14,
        fontFamily: 'monospace',
        color: '#3498db',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    statCard: {
        backgroundColor: '#fff',
        width: '45%',
        margin: '2.5%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    immutabilityCard: {
        backgroundColor: '#27ae60',
        margin: 15,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    immutabilityText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    immutabilitySubtext: {
        color: '#fff',
        fontSize: 12,
        marginTop: 5,
        opacity: 0.9,
    },
});

export default ProtocolScreen;
