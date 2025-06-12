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
            },
            incomes: [],
            editingIncome: null,
            incomeForm: {
                source: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            },
            selectedReportType: 'all' // Default: mostra entrate e uscite
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
        
        monthlyIncomeTotals() {
            const totals = {};
            if (this.incomes.length > 0) {
                this.incomes.forEach(income => {
                    const year = new Date(income.date).getFullYear();
                    const month = new Date(income.date).getMonth() + 1;
                    if (!totals[year]) totals[year] = {};
                    if (!totals[year][month]) totals[year][month] = 0;
                    totals[year][month] += income.amount;
                });
            }
            return totals;
        },
        monthlyBalance() {
            const balance = {};
            const allYears = [...new Set([...Object.keys(this.purchasesByYear), ...Object.keys(this.monthlyIncomeTotals)])];
            allYears.forEach(year => {
                balance[year] = {};
                const allMonths = [...new Set([
                    ...Object.keys(this.purchasesByYear[year] || {}),
                    ...Object.keys(this.monthlyIncomeTotals[year] || {})
                ])];
                allMonths.forEach(month => {
                    const expenses = this.purchasesByYear[year]?.[month]?.reduce((total, purchase) => total + purchase.amount, 0) || 0;
                    const incomes = this.monthlyIncomeTotals[year]?.[month] || 0;
                    balance[year][month] = incomes - expenses;
                });
            });
            return balance;
        },
        filteredIncomes() {
            if (this.selectedMonth === 'all') {
                return this.incomes.filter(income => {
                    const incomeYear = new Date(income.date).getFullYear();
                    return incomeYear === this.selectedYear;
                });
            }
            if (this.monthlyIncomeTotals[this.selectedYear] && this.monthlyIncomeTotals[this.selectedYear][this.selectedMonth]) {
                return this.incomes.filter(income => {
                    const incomeYear = new Date(income.date).getFullYear();
                    const incomeMonth = new Date(income.date).getMonth() + 1;
                    return incomeYear === this.selectedYear && incomeMonth === this.selectedMonth;
                });
            }
            return [];
        },
        filteredPurchases() {
            if (this.selectedMonth === 'all') {
                return this.purchases.filter(purchase => {
                    const purchaseYear = new Date(purchase.date).getFullYear();
                    return purchaseYear === this.selectedYear;
                });
            }
            if (this.purchasesByYear[this.selectedYear] && this.purchasesByYear[this.selectedYear][this.selectedMonth]) {
                return this.purchasesByYear[this.selectedYear][this.selectedMonth];
            }
            return [];
        },
        
        monthlyTotal() {
            if (this.selectedMonth === 'all') {
                return this.filteredPurchases.reduce((total, purchase) => total + purchase.amount, 0);
            }
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
        },
        
        yearlyIncomeTotals() {
            const totals = {};
            this.incomes.forEach(income => {
                const year = new Date(income.date).getFullYear();
                if (!totals[year]) totals[year] = 0;
                totals[year] += income.amount;
            });
            return totals;
        },
        yearlyBalance() {
            const balance = {};
            const allYears = [...new Set([...Object.keys(this.yearlyTotals), ...Object.keys(this.yearlyIncomeTotals)])];
            allYears.forEach(year => {
                const expenses = this.yearlyTotals[year] || 0;
                const incomes = this.yearlyIncomeTotals[year] || 0;
                balance[year] = incomes - expenses;
            });
            return balance;
        },
    },
    async mounted() {
        await this.loadConfig();
        await this.loadPlaces();
        await this.loadPurchases();
        await this.loadIncomes(); // Aggiunto
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
        
        getSourceName(source) {
            const sources = {
                'ripetizioni': 'Ripetizioni',
                'pagamenti per lavori': 'Pagamenti per lavori',
                'regali': 'Regali',
                'pagamenti online': 'Pagamenti online',
                'refund': 'Rimborsi',
                'other': 'Altro'
            };
            return sources[source] || source;
        },
        async loadIncomes() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.apiBaseUrl}/api/incomes`);
                this.incomes = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            } catch (error) {
                this.showMessage('Errore nel caricamento delle entrate', 'error');
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
        
        async saveIncome() {
            try {
                if (this.editingIncome) {
                    await axios.put(`${this.apiBaseUrl}/api/incomes/${this.editingIncome}`, this.incomeForm);
                    this.showMessage('Entrata aggiornata con successo!', 'success');
                } else {
                    await axios.post(`${this.apiBaseUrl}/api/incomes`, this.incomeForm);
                    this.showMessage('Entrata aggiunta con successo!', 'success');
                }
                this.resetIncomeForm();
                await this.loadIncomes();
            } catch (error) {
                this.showMessage('Errore nel salvare l\'entrata', 'error');
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
        
        async deleteIncome(id) {
            if (confirm('Sei sicuro di voler eliminare questa entrata?')) {
                try {
                    await axios.delete(`${this.apiBaseUrl}/api/incomes/${id}`);
                    this.showMessage('Entrata eliminata con successo!', 'success');
                    await this.loadIncomes();
                } catch (error) {
                    this.showMessage('Errore nell\'eliminare l\'entrata', 'error');
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
        
        editIncome(income) {
            this.editingIncome = income._id;
            this.incomeForm = {
                source: income.source,
                amount: income.amount,
                date: new Date(income.date).toISOString().split('T')[0],
                notes: income.notes || ''
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
        
        cancelEditIncome() {
            this.editingIncome = null;
            this.resetIncomeForm();
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
        
        resetIncomeForm() {
            this.incomeForm = {
                source: '',
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