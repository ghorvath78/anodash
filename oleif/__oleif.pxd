cdef extern from "oleif.hxx":
    cdef cppclass iForest:
        int limit
        iForest (int, int, int, int, int)
        void addNextTree (double*, int, int)
        void fit (double*, int, int)
        void predict (double*, double*, int)
        void predictSingleTree (double*, double*, int, int)
        void OutputTreeNodes (int)
