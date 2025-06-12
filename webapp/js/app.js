const { createApp } = Vue;

createApp({
    data() {
        return {
            apiBaseUrl: '',
            activeTab: 'purchases', //main section when the webapp loads
            loading: false,
            message: '',
            messageType: '',
            places: [],
            purchases: [],
            editingPlace: null,
            editingPurchase: null,
            selectedYear: new Date().getFullYear(),
            selectedMonth: new Date().getMonth() + 1,
            placeForm: {
                name: '',
                city: '',
                address: '',
                notes: ''
            },
            purchaseForm: {
                place: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            }
        }
    },
    computed: {
        totalAmount() {
            return this.purchases.reduce((total, purchase) => total + purchase.amount, 0);
        },
        
        purchasesByYear() {
            const grouped = {};
            this.purchases.forEach(purchase => {
                const year = new Date(purchase.date).getFullYear();
                if (!grouped[year]) {
                    grouped[year] = {};
                }
                
                const month = new Date(purchase.date).getMonth() + 1;
                if (!grouped[year][month]) {
                    grouped[year][month] = [];
                }
                
                grouped[year][month].push(purchase);
            });
            
            // Ordina gli anni dal più recente al più vecchio
            const sortedYears = Object.keys(grouped).sort((a, b) => b - a);
            const result = {};
            sortedYears.forEach(year => {
                result[year] = grouped[year];
                // Ordina i mesi dal più recente al più vecchio
                const sortedMonths = Object.keys(grouped[year]).sort((a, b) => b - a);
                const sortedMonthsObj = {};
                sortedMonths.forEach(month => {
                    // Ordina le spese del mese dalla più recente alla più vecchia
                    sortedMonthsObj[month] = grouped[year][month].sort((a, b) => new Date(b.date) - new Date(a.date));
                });
                result[year] = sortedMonthsObj;
            });
            
            return result;
        },
        
        availableYears() {
            return Object.keys(this.purchasesByYear).map(year => parseInt(year));
        },
        
        availableMonths() {
            if (this.purchasesByYear[this.selectedYear]) {
                return Object.keys(this.purchasesByYear[this.selectedYear]).map(month => parseInt(month));
            }
            return [];
        },
        
        filteredPurchases() {
            if (this.purchasesByYear[this.selectedYear] && this.purchasesByYear[this.selectedYear][this.selectedMonth]) {
                return this.purchasesByYear[this.selectedYear][this.selectedMonth];
            }
            return [];
        },
        
        monthlyTotal() {
            return this.filteredPurchases.reduce((total, purchase) => total + purchase.amount, 0);
        },
        
        yearlyTotals() {
            const totals = {};
            Object.keys(this.purchasesByYear).forEach(year => {
                totals[year] = 0;
                Object.keys(this.purchasesByYear[year]).forEach(month => {
                    totals[year] += this.purchasesByYear[year][month].reduce((total, purchase) => total + purchase.amount, 0);
                });
            });
            return totals;
        },
        
        monthlyTotals() {
            const totals = {};
            if (this.purchasesByYear[this.selectedYear]) {
                Object.keys(this.purchasesByYear[this.selectedYear]).forEach(month => {
                    totals[month] = this.purchasesByYear[this.selectedYear][month].reduce((total, purchase) => total + purchase.amount, 0);
                });
            }
            return totals;
        }
    },
    async mounted() {
        await this.loadConfig();
        await this.loadPlaces();
        await this.loadPurchases();
    },
    methods: {
        getMonthName(monthNumber) {
            const months = [
                'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
            ];
            return months[monthNumber - 1];
        },
        
        async loadConfig() {
            try {
                const response = await axios.get('/api/config');
                this.apiBaseUrl = response.data.apiBaseUrl;
            } catch (error) {
                this.apiBaseUrl = window.location.origin;
                console.warn('Could not load config, using fallback:', this.apiBaseUrl);
            }
        },

        async loadPlaces() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.apiBaseUrl}/api/places`);
                this.places = response.data;
            } catch (error) {
                this.showMessage('Errore nel caricamento dei posti', 'error');
            }
            this.loading = false;
        },
        
        async loadPurchases() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.apiBaseUrl}/api/purchases`);
                this.purchases = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            } catch (error) {
                this.showMessage('Errore nel caricamento delle spese', 'error');
            }
            this.loading = false;
        },
        
        async savePlace() {
            try {
                if (this.editingPlace) {
                    await axios.put(`${this.apiBaseUrl}/api/places/${this.editingPlace}`, this.placeForm);
                    this.showMessage('Posto aggiornato con successo!', 'success');
                } else {
                    await axios.post(`${this.apiBaseUrl}/api/places`, this.placeForm);
                    this.showMessage('Posto aggiunto con successo!', 'success');
                }
                this.resetPlaceForm();
                await this.loadPlaces();
            } catch (error) {
                this.showMessage('Errore nel salvare il posto', 'error');
            }
        },
        
        async savePurchase() {
            try {
                if (this.editingPurchase) {
                    await axios.put(`${this.apiBaseUrl}/api/purchases/${this.editingPurchase}`, this.purchaseForm);
                    this.showMessage('Spesa aggiornata con successo!', 'success');
                } else {
                    await axios.post(`${this.apiBaseUrl}/api/purchases`, this.purchaseForm);
                    this.showMessage('Spesa aggiunta con successo!', 'success');
                }
                this.resetPurchaseForm();
                await this.loadPurchases();
            } catch (error) {
                this.showMessage('Errore nel salvare la spesa', 'error');
            }
        },
        
        async deletePlace(id) {
            if (confirm('Sei sicuro di voler eliminare questo posto?')) {
                try {
                    await axios.delete(`${this.apiBaseUrl}/api/places/${id}`);
                    this.showMessage('Posto eliminato con successo!', 'success');
                    await this.loadPlaces();
                } catch (error) {
                    this.showMessage('Errore nell\'eliminare il posto', 'error');
                }
            }
        },
        
        async deletePurchase(id) {
            if (confirm('Sei sicuro di voler eliminare questa spesa?')) {
                try {
                    await axios.delete(`${this.apiBaseUrl}/api/purchases/${id}`);
                    this.showMessage('Spesa eliminata con successo!', 'success');
                    await this.loadPurchases();
                } catch (error) {
                    this.showMessage('Errore nell\'eliminare la spesa', 'error');
                }
            }
        },
        
        editPlace(place) {
            this.editingPlace = place._id;
            this.placeForm = {
                name: place.name,
                city: place.city,
                address: place.address || '',
                notes: place.notes || ''
            };
        },
        
        editPurchase(purchase) {
            this.editingPurchase = purchase._id;
            this.purchaseForm = {
                place: purchase.place._id,
                amount: purchase.amount,
                date: new Date(purchase.date).toISOString().split('T')[0],
                notes: purchase.notes || ''
            };
        },
        
        cancelEdit() {
            this.editingPlace = null;
            this.resetPlaceForm();
        },
        
        cancelEditPurchase() {
            this.editingPurchase = null;
            this.resetPurchaseForm();
        },
        
        resetPlaceForm() {
            this.placeForm = {
                name: '',
                city: '',
                address: '',
                notes: ''
            };
        },
        
        resetPurchaseForm() {
            this.purchaseForm = {
                place: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            };
        },
        
        showMessage(text, type) {
            this.message = text;
            this.messageType = type;
            setTimeout(() => {
                this.message = '';
                this.messageType = '';
            }, 3000);
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('it-IT');
        }
    }
}).mount('#app');